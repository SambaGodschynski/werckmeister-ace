/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

define(function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var currentVoice = null;

    var Event = "constant.other event";

    function normalizeClassName(name) {
        return name.replace(/[^a-zA-Z0-9]/g, '');
    }

    function getChordToken(token) {
        return Event + " chord chord-" + normalizeClassName(token[0]);
    }
    function getNoteToken(token) {
        return Event + " note note-" + normalizeClassName(token);
    }
    function getRestToken(token) {
        token = token || '';
        return Event + " rest " + token;
    }
    function getClusterToken(token, currentState, stack, line, pos) {
        var res = getNoteToken(token, currentState, stack, line, pos);
        res += " cluster";
        return res;
    }
    var SheetHighlightRules = function () {

        var degrees = (["I", "II", "III", "IV", "V", "VI", "VII",
        "Ib", "IIb", "IIIb", "IVb", "Vb", "VIb", "VIIb",
        "I#", "II#", "III#", "IV#", "V#", "VI#", "VII"])

        var alias = '\".*?\"';
        var notes = ([ alias, "c", "cis", "des", "d", "dis", "es", "e", "fes"
            , "eis", "f", "fis", "ges", "g", "gis", "as", "a", "ais", "bes"
            , "b", "ces", "bis"])
            .concat(degrees)
            .sort()
            .reverse() // cis has to appear before c
            .join('|');
            

        var octaves = ",,,,,|,,,,|,,,|,,|,|'''''|''''|'''|''|'";

        var durations = (["1", "2", "4", "8", "16", "32", "64", "128", "1\\.", "2\\.", "4\\.", "8\\.",
            "16\\.", "32\\.", "64\\.", "128\\.", "1t", "2t", "4t", "8t", "16t", "32t", "64t", "128t",
            "1n5", "2n5", "4n5", "8n5", "16n5", "32n5", "64n5", "128n5", "1n7", "2n7", "4n7",
            "8n7", "16n7", "32n7", "64n7", "128n7", "1n9", "2n9", "4n9", "8n9", "16n9", "32n9",
            "64n9", "128n9"
        ])
            .sort()
            .reverse()
            .join('|');

        var expressionSymbols = ["p", "pp", "ppp", "pppp", "ppppp",
        "f", "ff", "fff", "ffff", "fffff"];

        var expressions = "\\\\" 
            + expressionSymbols
            .sort()
            .reverse()
            .join('|\\\\');

        var expressionPlayedOnce = "!" 
            + expressionSymbols
            .sort()
            .reverse()
            .join('|!');

        // regexp must not have capturing parentheses. Use (?:) instead.
        // regexps are ordered -> the first match is used
        this.$rules = {
            "start": [
                {
                    token: "keyword document-config document-config-load",
                    regex: "@\\w+ *",
                    next: "documentConfig.String"
                },
                {
                    token: "keyword metaevent",
                    regex: "\\w+:",
                    next: "document.metaevent"
                },                
                {
                    token: "paren.lparen track-begin track",
                    regex: "\\[",
                    next: "track",
                },
            ],
            "documentConfig.String": [
                {
                    token: "string",
                    regex: "\".*?\"",
                    next: "eol"
                },
            ],
            "eol": [
                {
                    token: "eol",
                    regex: "; *$",
                    next: "start"
                }
            ],
            "track": [
                {
                    token: "paren.lparen voice voice-begin",
                    regex: "\\{",
                    next: "voice"
                },
                {
                    token: "paren.rparen track track-end",
                    regex: "\\]",
                    next: "start"
                },
                {
                    token: "keyword metaevent",
                    regex: "\\w+:",
                    next: "track.metaevent"
                },                   
            ],
            "voice": [
                {
                    token: "keyword metaevent",
                    regex: "/\\w+:",
                    next: "voice.metaevent"
                },
                {
                    token: "meta expression",
                    regex: expressions
                },
                {
                    token: "meta expression",
                    regex: expressionPlayedOnce
                },     
                {
                    token: getNoteToken,
                    regex: "(" + notes + ")(" + octaves + "){0,1}(" + durations + "){0,1}",
                },
                {
                    token: getClusterToken,
                    regex: "< *((" + notes + ") *(" + octaves + "){0,1} *)+ *>(" + durations + "){0,1}",
                },
                {
                    token: getChordToken,
                    regex: "[A-Z][a-zA-Z0-9/+#~*!?-]*",
                },                
                {
                    token: getRestToken,
                    regex: "r(" + durations + "){0,1}",
                },        
                {
                    token: " eob",
                    regex: "\\|"
                },
                {
                    token: "paren.rparen voice voice-end",
                    regex: "\\}",
                    next: "track"
                }
            ],
            "voice.metaevent": [
                {
                    token: "variable.parameter metaargs",
                    regex: "([a-zA-Z0-9.] *)+",
                },
                {
                    token: "keyword metaevent-end",
                    regex: "/",
                    next: "voice"   
                }
            ],
            "track.metaevent": [
                {
                    token: "variable.parameter metaargs",
                    regex: "([a-zA-Z0-9.] *)+",
                },
                {
                    token: "keyword metaevent-end",
                    regex: ";",
                    next: "track"   
                }
            ],                 
            "document.metaevent": [
                {
                    token: "variable.parameter metaargs",
                    regex: "([a-zA-Z0-9.] *)+",
                },
                {
                    token: "keyword metaevent-end",
                    regex: ";",
                    next: "start"   
                }
            ],            
        };

        let commentRules = {};
        for(let rule in this.$rules) {
            let commentRuleName = `comment-${rule}`
            let commentBeginRule = {
                token: "comment begin",
                regex: "--",
                next: commentRuleName
            }
            let emptyComment = {
                token: "comment",
                regex: "--$",
            }            
            commentRules[commentRuleName] = [
                {
                    token: "comment comment-contnet link",
                    regex: "[a-z]+://[a-zA-Z0-9_!~*'().;?:@&=+$,%#-/]+"
                },
                {
                    token: "comment comment-contnet",
                    regex: ".",
                },
                {
                    token: "",
                    regex: "$",
                    next: rule
                    
                }
            ]
            this.$rules[rule].splice(0, 0, commentBeginRule);
            this.$rules[rule].splice(0, 0, emptyComment);
        }
        Object.assign(this.$rules, commentRules);
    };

    oop.inherits(SheetHighlightRules, TextHighlightRules);
    exports.SheetHighlightRules = SheetHighlightRules;
});
