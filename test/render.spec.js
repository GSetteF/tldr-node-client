'use strict';

const assert = require('node:assert/strict')
const { describe, it, beforeEach } = require('node:test');
const render = require('../lib/render');
const Theme = require('../lib/theme');

describe('Render', () => {
  let themeConfig;

  beforeEach(() => {
    themeConfig = {
      'themes': {
        'base16': {
          'commandName': 'bold',
          'mainDescription': '',
          'exampleDescription': 'green',
          'exampleCode': 'red',
          'exampleToken': 'cyan'
        }
      },
      'theme': 'base16'
    };
  });

  it('surrounds the output with blank lines', () => {
    let text = render.toANSI({
      name: 'tar',
      description: 'archive utility',
      examples: []
    }, themeConfig);
    assert.equal(text?.startsWith('\n'), true);
    assert.equal(text?.endsWith('\n'), true);
  });

  it('contains the command name', () => {
    let text = render.toANSI({
      name: 'tar',
      description: 'archive utility',
      examples: []
    }, themeConfig);
    assert.equal(text?.includes('tar'), true);
    assert.equal(text?.includes('archive utility'), true);
  });

  it('contains the description name', () => {
    let text = render.toANSI({
      name: 'tar',
      description: 'archive utility\nwith support for compression',
      examples: []
    }, themeConfig);
    assert.equal(text?.includes('archive utility'), true);
    assert.equal(text?.includes('with support for compression'), true);
  });

  it('highlights replaceable {{tokens}}', () => {
    let text = render.toANSI({
      name: 'tar',
      description: 'archive utility',
      examples: [{
        description: 'create',
        code: 'hello {{token}} bye'
      }]
    }, themeConfig);
    assert.equal(text?.includes('hello'), true);
    assert.equal(text?.includes('token'), true);
    assert.equal(text?.includes('bye'), true);
  });

  describe('placeholder escaping (client specification v2.1)', () => {
    // Renders a single example and returns its code line with literal code
    // wrapped in [...] and highlighted placeholders wrapped in <...>, so the
    // tests can tell highlighted placeholders from literal text.
    function renderCode(t, code) {
      t.mock.method(Theme.prototype, 'renderExampleCode', (text) => text ? `[${text}]` : '');
      t.mock.method(Theme.prototype, 'renderExampleToken', (text) => `<${text}>`);
      const text = render.toANSI({
        name: 'x',
        description: 'd',
        examples: [{ description: 'e', code }]
      }, themeConfig);
      return text?.split('\n').find((line) => line.startsWith('    '))?.slice(4);
    }

    it('still highlights an unescaped placeholder', (t) => {
      assert.equal(renderCode(t, 'docker {{container}} run'), '[docker ]<container>[ run]');
    });

    it('shows fully escaped braces as literal braces without backslashes', (t) => {
      assert.equal(renderCode(t, '--format \\{\\{.Name\\}\\}'), '[--format {{.Name}}]');
    });

    it('shows escaped closing braces on their own as literal braces', (t) => {
      assert.equal(renderCode(t, 'a \\}\\} b'), '[a }} b]');
    });

    it('keeps the backslash when only one brace is escaped', (t) => {
      assert.equal(renderCode(t, 'a \\{ b'), '[a \\{ b]');
      assert.equal(renderCode(t, 'a \\} b'), '[a \\} b]');
    });

    it('keeps the backslash when only the first brace of a pair is escaped', (t) => {
      // `\{{` is not an escape: the backslash stays and `{{x}}` is a placeholder.
      assert.equal(renderCode(t, '\\{{x}}'), '[\\]<x>');
    });

    it('handles escaped braces and a placeholder on the same line', (t) => {
      assert.equal(
        renderCode(t, "docker inspect --format '\\{\\{.Name\\}\\}' {{container}}"),
        "[docker inspect --format '{{.Name}}' ]<container>"
      );
    });

    it('supports escaped braces inside a placeholder', (t) => {
      assert.equal(renderCode(t, '{{a\\}\\}b}}'), '<a}}b>');
    });

    it('leaves an unmatched {{ as plain text', (t) => {
      assert.equal(renderCode(t, 'echo {{ oops'), '[echo {{ oops]');
    });
  });

  it('should correctly render see also section', () => {
    let text = render.toANSI({
      name: 'uname',
      description: 'Description for `uname`.\n' +
        'See also `lsb_release`.',
      examples: [{
        description: '1st example. You need `sudo` to run this',
        code: 'uname {{token}}'
      }],
      seeAlso: [
        'lsb_release',
        'sudo'
      ]
    }, themeConfig);
    assert.equal(text?.includes('See also: lsb_release, sudo'), true);
  });

  it('should return an error for invalid theme', (t) => {
    const error = t.mock.method(console, 'error');

    const config = {
      'themes': {
        'base16': {
          'commandName': 'bold',
          'mainDescription': '',
          'exampleDescription': 'green',
          'exampleCode': 'red',
          'exampleToken': 'cyan'
        }
      },
      'theme': 'bad'
    };

    let text = render.toANSI({
      name: 'tar',
      description: 'archive utility',
      examples: [],
    }, config);
    assert.equal(!!text, false);
    assert.equal(error.mock.calls[0].arguments[0], 'invalid theme: bad');
  });
});
