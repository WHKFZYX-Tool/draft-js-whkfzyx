/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DraftEditorContents.react
 * @typechecks
 * @flow
 */

'use strict';

import type ContentBlock from 'ContentBlock';
import type {BidiDirection} from 'UnicodeBidiDirection';

const DraftEditorBlock = require('DraftEditorBlock.react');
const DraftOffsetKey = require('DraftOffsetKey');
const EditorState = require('EditorState');
const React = require('React');

const cx = require('cx');
const joinClasses = require('joinClasses');
const nullthrows = require('nullthrows');
const DraftBlockTypeAnalysis = require('DraftBlockTypeAnalysis');

type Props = {
  blockRendererFn: Function,
  blockStyleFn: (block: ContentBlock) => string,
  editorState: EditorState,
  textDirectionality?: BidiDirection,
};

/**
 * `DraftEditorContents` is the container component for all block components
 * rendered for a `DraftEditor`. It is optimized to aggressively avoid
 * re-rendering blocks whenever possible.
 *
 * This component is separate from `DraftEditor` because certain props
 * (for instance, ARIA props) must be allowed to update without affecting
 * the contents of the editor.
 */
class DraftEditorContents extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props): boolean {
    const prevEditorState = this.props.editorState;
    const nextEditorState = nextProps.editorState;

    const prevDirectionMap = prevEditorState.getDirectionMap();
    const nextDirectionMap = nextEditorState.getDirectionMap();

    // Text direction has changed for one or more blocks. We must re-render.
    if (prevDirectionMap !== nextDirectionMap) {
      return true;
    }

    const didHaveFocus = prevEditorState.getSelection().getHasFocus();
    const nowHasFocus = nextEditorState.getSelection().getHasFocus();

    if (didHaveFocus !== nowHasFocus) {
      return true;
    }

    const nextNativeContent = nextEditorState.getNativelyRenderedContent();

    const wasComposing = prevEditorState.isInCompositionMode();
    const nowComposing = nextEditorState.isInCompositionMode();

    // If the state is unchanged or we're currently rendering a natively
    // rendered state, there's nothing new to be done.
    if (
      prevEditorState === nextEditorState ||
      (
        nextNativeContent !== null &&
        nextEditorState.getCurrentContent() === nextNativeContent
      ) ||
      (wasComposing && nowComposing)
    ) {
      return false;
    }

    const prevContent = prevEditorState.getCurrentContent();
    const nextContent = nextEditorState.getCurrentContent();
    const prevDecorator = prevEditorState.getDecorator();
    const nextDecorator = nextEditorState.getDecorator();
    return (
      wasComposing !== nowComposing ||
      prevContent !== nextContent ||
      prevDecorator !== nextDecorator ||
      nextEditorState.mustForceSelection()
    );
  }

  render(): React.Node {
    const {
      /* $FlowFixMe(>=0.53.0 site=www,mobile) This comment suppresses an error
       * when upgrading Flow's support for React. Common errors found when
       * upgrading Flow's React support are documented at
       * https://fburl.com/eq7bs81w */
      blockRenderMap,
      blockRendererFn,
      /* $FlowFixMe(>=0.53.0 site=www,mobile) This comment suppresses an error
       * when upgrading Flow's support for React. Common errors found when
       * upgrading Flow's React support are documented at
       * https://fburl.com/eq7bs81w */
      customStyleMap,
      /* $FlowFixMe(>=0.53.0 site=www,mobile) This comment suppresses an error
       * when upgrading Flow's support for React. Common errors found when
       * upgrading Flow's React support are documented at
       * https://fburl.com/eq7bs81w */
      customStyleFn,
      editorState,
    } = this.props;

    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const forceSelection = editorState.mustForceSelection();
    const decorator = editorState.getDecorator();
    const directionMap = nullthrows(editorState.getDirectionMap());

    const blocksAsArray = content.getBlocksAsArray();
    const processedBlocks = [];
    let currentDepth = null;
    let lastWrapperTemplate = null;

    let currentBlock = 0;   //当前Block的计数（第n个Block）
    let maxLiDepth = 0;   //最大<li>的depth，用于控制层级
    let previousBlockDepth = null;  //上一个Block的层级Depth
    let currentBlockStyleNum = 0;   //当前有序和无序列表样式层级数    

    for (let ii = 0; ii < blocksAsArray.length; ii++) {
      const block = blocksAsArray[ii];
      const key = block.getKey();
      const blockType = DraftBlockTypeAnalysis.getDraftBlockTypeAnalysis(block.getType());
      const realBlockType = block.getType();    //当前真正的BlockType，用于处理有序和无序列表的其他样式。

      const customRenderer = blockRendererFn(block);
      let CustomComponent, customProps, customEditable;
      if (customRenderer) {
        CustomComponent = customRenderer.component;
        customProps = customRenderer.props;
        customEditable = customRenderer.editable;
      }

      const {textDirectionality} = this.props;
      const direction = textDirectionality
        ? textDirectionality
        : directionMap.get(key);
      const offsetKey = DraftOffsetKey.encode(key, 0, 0);
      const componentProps = {
        contentState: content,
        block,
        blockProps: customProps,
        customStyleMap,
        customStyleFn,
        decorator,
        direction,
        forceSelection,
        key,
        offsetKey,
        selection,
        tree: editorState.getBlockTree(key),
      };

      const configForType = blockRenderMap.get(blockType);
      const wrapperTemplate = configForType.wrapper;

      const Element = (
        configForType.element ||
        blockRenderMap.get('unstyled').element
      );

      const depth = block.getDepth();
      let className = this.props.blockStyleFn(block);
      let receiveClassName = getReceiveClass(block);
      //获取上一个Block和BlockType
      let previousBlock = getPreviousBlock(blocksAsArray,currentBlock);
      let previousBlockType =  null;
      let realPreviousBlockType = null;
      if(previousBlock){
        previousBlockType = DraftBlockTypeAnalysis.getDraftBlockTypeAnalysis(previousBlock.getType()); 
        realPreviousBlockType = previousBlock.getType();
      }   
      //如果上一个Block不属于序列 && 当前Block属于序列，就设置为一个新的序列树。
      if(!canHaveDepth(previousBlockType) && canHaveDepth(blockType)){        
        maxLiDepth = 0;
        previousBlockDepth = null;     
      }

      // List items are special snowflakes, since we handle nesting and
      // counters manually.
      if (Element === 'li') {
        //获取当前最大层级数
        if(depth > maxLiDepth){
          maxLiDepth = depth;
        }
        
        //如果当层与上层的BlockType不同，样式就开始重新计数。相同则判断是否在同一层，如果不在同一层就+1
        if(realBlockType !== realPreviousBlockType){
          currentBlockStyleNum = getBlockStyleNum(realBlockType);
        }else{
          if(previousBlockDepth !== null && previousBlockDepth !== depth){
              currentBlockStyleNum += 1;            
          } 
        }   
        
        const olulType = blockType === 'unordered-list-item' 
        ? DraftBlockTypeAnalysis.getUlStyleType(currentBlockStyleNum) 
        : DraftBlockTypeAnalysis.getOlStyleType(currentBlockStyleNum);

        const shouldResetCount = (
          lastWrapperTemplate !== wrapperTemplate ||
          currentDepth === null ||
          depth > currentDepth
        );
        className = joinClasses(
          className,
          receiveClassName !== ""?receiveClassName:getListItemClasses(blockType, depth, shouldResetCount, direction,olulType),
        );
      }

      const Component = CustomComponent || DraftEditorBlock;
      let childProps = {
        className,
        'data-block': true,
        /* $FlowFixMe(>=0.53.0 site=www,mobile) This comment suppresses an
         * error when upgrading Flow's support for React. Common errors found
         * when upgrading Flow's React support are documented at
         * https://fburl.com/eq7bs81w */
        'data-editor': this.props.editorKey,
        'data-offset-key': offsetKey,
        key,
      };
      if (customEditable !== undefined) {
        childProps = {
          ...childProps,
          contentEditable: customEditable,
          suppressContentEditableWarning: true,
        };
      }

      const child = React.createElement(
        Element,
        childProps,
        /* $FlowFixMe(>=0.53.0 site=www,mobile) This comment suppresses an
         * error when upgrading Flow's support for React. Common errors found
         * when upgrading Flow's React support are documented at
         * https://fburl.com/eq7bs81w */
        <Component {...componentProps} />,
      );

      processedBlocks.push({
        block: child,
        wrapperTemplate,
        key,
        offsetKey,
      });

      if (wrapperTemplate) {
        currentDepth = block.getDepth();
      } else {
        currentDepth = null;
      }

      previousBlockDepth = depth;
      currentBlock += 1;      
      lastWrapperTemplate = wrapperTemplate;
    }

    // Group contiguous runs of blocks that have the same wrapperTemplate
    const outputBlocks = [];
    for (let ii = 0; ii < processedBlocks.length; ) {
      const info = processedBlocks[ii];
      if (info.wrapperTemplate) {
        const blocks = [];
        do {
          blocks.push(processedBlocks[ii].block);
          ii++;
        } while (
          ii < processedBlocks.length &&
          processedBlocks[ii].wrapperTemplate === info.wrapperTemplate
        );
        const wrapperElement = React.cloneElement(
          info.wrapperTemplate,
          {
            key: info.key + '-wrap',
            'data-offset-key': info.offsetKey,
          },
          blocks,
        );
        outputBlocks.push(wrapperElement);
      } else {
        outputBlocks.push(info.block);
        ii++;
      }
    }

    return <div data-contents="true">{outputBlocks}</div>;
  }
}

/**
 * Provide default styling for list items. This way, lists will be styled with
 * proper counters and indentation even if the caller does not specify
 * their own styling at all. If more than five levels of nesting are needed,
 * the necessary CSS classes can be provided via `blockStyleFn` configuration.
 */
function getListItemClasses(
  type: string,
  depth: number,
  shouldResetCount: boolean,
  direction: BidiDirection,
  olulType: string,
): string {
  //ul和ol的下拉按钮的type都转成ul与ol的type,保持跟ul和ol的操作不变
  type = DraftBlockTypeAnalysis.getDraftBlockTypeAnalysis(type);  

  return cx({
    'public/DraftStyleDefault/unorderedListItem':
      type === 'unordered-list-item',
    'public/DraftStyleDefault/orderedListItem':
      type === 'ordered-list-item',
    'public/DraftStyleDefault/reset': shouldResetCount,
    'public/DraftStyleDefault/depth0': depth === 0,
    'public/DraftStyleDefault/depth1': depth === 1,
    'public/DraftStyleDefault/depth2': depth === 2,
    'public/DraftStyleDefault/depth3': depth === 3,
    'public/DraftStyleDefault/depth4': depth === 4,
    'public/DraftStyleDefault/listLTR': direction === 'LTR',
    'public/DraftStyleDefault/listRTL': direction === 'RTL',
    'public/DraftStyleDefault/disc': olulType === 'disc',
    'public/DraftStyleDefault/circle': olulType === 'circle',
    'public/DraftStyleDefault/square': olulType === 'square',
    'public/DraftStyleDefault/image': olulType === 'image',
    'public/DraftStyleDefault/decimaltype1': olulType === 'decimalType1',
    'public/DraftStyleDefault/decimaltype2': olulType === 'decimalType2',
    'public/DraftStyleDefault/decimaltype3': olulType === 'decimalType3',
  });
}

function getPreviousBlock(blocksAsArray,currentBlock) {
  return blocksAsArray[currentBlock - 1]
}

function canHaveDepth(blockType: string): boolean {
  //ul和ol的下拉按钮的type都转成ul与ol的type,保持跟ul和ol的操作不变
  blockType = DraftBlockTypeAnalysis.getDraftBlockTypeAnalysis(blockType);  

  switch (blockType) {
    case 'unordered-list-item':
    case 'ordered-list-item':
      return true;
    default:
      return false;
  }
}

function getBlockStyleNum(blockType: string): number {
  switch (blockType) {
    case 'unordered-list-item-disc':
      return 0;
    case 'unordered-list-item-circle':
      return 1;
    case 'unordered-list-item-square':
      return 2;
    case 'unordered-list-item-image':
      return 3;
    case 'ordered-list-item-decimal-type1':
      return 0;
    case 'ordered-list-item-decimal-type2':
      return 1;
    case 'ordered-list-item-decimal-type3':
      return 2;
    default:
      return 0;
  }
}

function getReceiveClass(block) {
  let data = block.getData();

  let mergedStyle="";
  
  if (data.has("class")) {
    mergedStyle=data.get("class");
  } 
  return mergedStyle;
}

module.exports = DraftEditorContents;
