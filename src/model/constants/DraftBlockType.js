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

/**
 * The list of default valid block types.
 */
export type DraftBlockType = (
  'unstyled' |
  'paragraph' |
  'header-one' |
  'header-two' |
  'header-three' |
  'header-four' |
  'header-five' |
  'header-six' |
  'unordered-list-item' |
  'unordered-list-item-disc' |
  'unordered-list-item-circle' |
  'unordered-list-item-square' |
  'unordered-list-item-image' |
  'ordered-list-item' |
  'ordered-list-item-decimal-type1' |
  'ordered-list-item-decimal-type2' |
  'ordered-list-item-decimal-type3' |
  'blockquote' |
  'code-block' |
  'atomic'
);
