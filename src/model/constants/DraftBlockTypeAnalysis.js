/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DraftBlockType
 * @flow
 */

'use strict';
import type {DraftBlockType} from 'DraftBlockType';
const {List} = require('immutable');

const ulStyleType = List(
    ['disc','circle','square','image']
);

const olStyleType = List(
    ['decimalType1','decimalType2','decimalType3']
);

/**
 * The list of default valid block types.
 */
const DraftBlockTypeAnalysis = {

    getDraftBlockTypeAnalysis: function(
        blockType: DraftBlockType
      ): DraftBlockType {
        switch (blockType) {
            case 'unordered-list-item-disc':
            case 'unordered-list-item-circle':
            case 'unordered-list-item-square':
            case 'unordered-list-item-image':
                return 'unordered-list-item';
            case 'ordered-list-item-decimal-type1':
            case 'ordered-list-item-decimal-type2':
            case 'ordered-list-item-decimal-type3':
                return 'ordered-list-item';
            default:
                return blockType;
        }
      },

    getUlStyleType: function(styleKey: number): string{
        styleKey = styleKey % ulStyleType.size;
        return ulStyleType.get(styleKey,'disc');
    },  
    
    getOlStyleType: function(styleKey: number): string{
        styleKey = styleKey % olStyleType.size;
        return olStyleType.get(styleKey,'decimalType1');
    },     
    
};

module.exports = DraftBlockTypeAnalysis;
