/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule convertFromDraftStateToRaw
 * @flow
 */

'use strict';

import type ContentState from 'ContentState';
import type {RawDraftContentState} from 'RawDraftContentState';

var DraftStringKey = require('DraftStringKey');

var encodeEntityRanges = require('encodeEntityRanges');
var encodeInlineStyleRanges = require('encodeInlineStyleRanges');

function convertFromDraftStateToPduState(
  contentState: ContentState,
): RawDraftContentState {
  var rawBlocks = [];

  contentState.getBlockMap().forEach((block, blockKey) => {
    rawBlocks.push({
      key: blockKey,
      text: block.getText(),
      type: block.getType(),
      depth: block.getDepth(),
      inlineStyleRanges: encodeInlineStyleRanges(block),
      data: block.getData().toObject(),
    });
  });

  return {
    blocks: rawBlocks,
  };
}

module.exports = convertFromDraftStateToPduState;
