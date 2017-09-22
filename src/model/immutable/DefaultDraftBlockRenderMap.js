/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DefaultDraftBlockRenderMap
 * @flow
 */

'use strict';

import type {DraftBlockRenderMap} from 'DraftBlockRenderMap';

const {Map} = require('immutable');
const React = require('React');

const cx = require('cx');

const UL_WRAP = <ul className={cx('public/DraftStyleDefault/ul')} />;
const OL_WRAP = <ol className={cx('public/DraftStyleDefault/ol')} />;
const PRE_WRAP = <pre className={cx('public/DraftStyleDefault/pre')} />;

const DefaultDraftBlockRenderMap: DraftBlockRenderMap = Map({
  'header-one': {
    element: 'h1',
  },
  'header-two': {
    element: 'h2',
  },
  'header-three': {
    element: 'h3',
  },
  'header-four': {
    element: 'h4',
  },
  'header-five': {
    element: 'h5',
  },
  'header-six': {
    element: 'h6',
  },
  'unordered-list-item': {
    element: 'li',
    wrapper: UL_WRAP,
  },
  'unordered-list-item-disc': {
    element: 'li',
    wrapper: UL_WRAP,
  },
  'unordered-list-item-circle': {
    element: 'li',
    wrapper: UL_WRAP,
  },
  'unordered-list-item-square': {
    element: 'li',
    wrapper: UL_WRAP,
  },
  'unordered-list-item-image': {
    element: 'li',
    wrapper: UL_WRAP,
  },        
  'ordered-list-item': {
    element: 'li',
    wrapper: OL_WRAP,
  },
  'ordered-list-item-decimal-type1': {
    element: 'li',
    wrapper: OL_WRAP,
  },
  'ordered-list-item-decimal-type2': {
    element: 'li',
    wrapper: OL_WRAP,
  },
  'ordered-list-item-decimal-type3': {
    element: 'li',
    wrapper: OL_WRAP,
  },       
  'blockquote': {
    element: 'blockquote',
  },
  'atomic': {
    element: 'figure',
  },
  'code-block': {
    element: 'pre',
    wrapper: PRE_WRAP,
  },
  'unstyled': {
    element: 'div',
    aliasedElements: ['p'],
  },
});

module.exports = DefaultDraftBlockRenderMap;
