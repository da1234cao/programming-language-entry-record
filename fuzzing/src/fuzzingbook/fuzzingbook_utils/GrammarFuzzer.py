#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# This material is part of "The Fuzzing Book".
# Web site: https://www.fuzzingbook.org/html/GrammarFuzzer.html
# Last change: 2019-12-21 16:38:57+01:00
#
#!/
# Copyright (c) 2018-2020 CISPA, Saarland University, authors, and contributors
#
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to
# the following conditions:
#
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
# OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
# CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
# TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


# # Efficient Grammar Fuzzing

# 下面是从efficeng_grammar_fuzzing中复制过来的内容

from .Grammars import simple_grammar_fuzzer,is_valid_grammar
from .Grammars import RE_NONTERMINAL, nonterminals, is_nonterminal,exp_string
from .Grammars import START_SYMBOL,EXPR_GRAMMAR
from .Fuzzer import Fuzzer
import random
from graphviz import Digraph
import re
from IPython.display import display


############################## 展示解析树
def dot_escape(s):
    """Return s in a form suitable for dot"""
    s = re.sub(r'([^a-zA-Z0-9" ])', r"\\\1", s)
    return s


def extract_node(node, id):
    symbol, children, *annotation = node
    return symbol, children, ''.join(str(a) for a in annotation)

# Escaping unicode characters into ASCII for user-facing strings
def unicode_escape(s, error="backslashreplace"):
    def ascii_chr(byte):
        if 0 <= byte <= 127:
            return chr(byte)
        return r"\x%02x" % byte

    bytes = s.encode('utf-8', error)
    # if not isinstance(bytes[0],int):
    #     assert("unicode_esapce_function type error")
    return "".join(map(ascii_chr, bytes))


def default_node_attr(dot, nid, symbol, ann):
    dot.node(repr(nid), dot_escape(unicode_escape(symbol)))


def default_edge_attr(dot, start_node, stop_node):
    dot.edge(repr(start_node), repr(stop_node))


def default_graph_attr(dot):
    dot.attr('node', shape='plain')


def display_tree(derivation_tree,
                 log=False,
                 extract_node=extract_node,
                 node_attr=default_node_attr,
                 edge_attr=default_edge_attr,
                 graph_attr=default_graph_attr):

    # If we import display_tree, we also have to import its functions
    from graphviz import Digraph

    counter = 0

    def traverse_tree(dot, tree, id=0):
        (symbol, children, annotation) = extract_node(tree, id)
        node_attr(dot, id, symbol, annotation)

        if children:
            for child in children:
                nonlocal counter
                counter += 1
                child_id = counter
                edge_attr(dot, id, child_id)
                traverse_tree(dot, child, child_id)

    dot = Digraph(comment="Derivation Tree")
    graph_attr(dot)
    traverse_tree(dot, derivation_tree)
    if log:
        print(dot)
    return dot


def display_annotated_tree(tree, a_nodes, a_edges, log=False):
    # 给图中的边或节点，添加注释
    def graph_attr(dot):
        dot.attr('node', shape='plain')
        dot.graph_attr['rankdir'] = 'LR'

    def annotate_node(dot, nid, symbol, ann):
        if nid in a_nodes:
            dot.node(repr(nid), "%s (%s)" % (dot_escape(unicode_escape(symbol)), a_nodes[nid]))
        else:
            dot.node(repr(nid), dot_escape(unicode_escape(symbol)))

    def annotate_edge(dot, start_node, stop_node):
        if (start_node, stop_node) in a_edges:
            dot.edge(repr(start_node), repr(stop_node),
                     a_edges[(start_node, stop_node)])
        else:
            dot.edge(repr(start_node), repr(stop_node))

    return display_tree(tree, log=log,
                 node_attr=annotate_node,
                 edge_attr=annotate_edge,
                 graph_attr=graph_attr)


def all_terminals(tree):
    # 所有的叶子节点
    (symbol, children) = tree
    if children is None:
        # This is a nonterminal symbol not expanded yet
        return symbol

    if len(children) == 0:
        # This is a terminal symbol
        return symbol

    # This is an expanded symbol:
    # Concatenate all terminal symbols from all children
    return ''.join([all_terminals(c) for c in children])


def tree_to_string(tree):
    # 叶子节点中的终端描述符
    symbol, children, *_ = tree
    if children:
        return ''.join(tree_to_string(c) for c in children)
    else:
        return '' if is_nonterminal(symbol) else symbol



######################### 拓展节点
class GrammarFuzzer(Fuzzer):
    def __init__(self, grammar, start_symbol=START_SYMBOL,
                 min_nonterminals=0, max_nonterminals=10, disp=False, log=False):
        """Produce strings from `grammar`, starting with `start_symbol`.
        If `min_nonterminals` or `max_nonterminals` is given, use them as limits 
        for the number of nonterminals produced.  
        If `disp` is set, display the intermediate derivation trees.
        If `log` is set, show intermediate steps as text on standard output."""

        self.grammar = grammar
        self.start_symbol = start_symbol
        self.min_nonterminals = min_nonterminals
        self.max_nonterminals = max_nonterminals
        self.disp = disp
        self.log = log
        self.check_grammar(grammar)

    def check_grammar(self,grammar):
        return is_valid_grammar(grammar)

    def expansion_to_children(self,expansion):
        # 将文法中，某个symble对应的expansions中的一个expansion转换成，一个tuple作为元素的list
        expansion = exp_string(expansion)
        assert isinstance(expansion, str)

        if expansion == "":  # Special case: epsilon expansion
            return [("", [])]

        strings = re.split(RE_NONTERMINAL, expansion)
        return [(s, None) if is_nonterminal(s) else (s, [])
                for s in strings if len(s) > 0]


    def choose_node_expansion(self, node, possible_children):
        """Return index of expansion in `possible_children` to be selected.  Defaults to random."""
        # 把选择的功能，剔出来，便于以后扩展。
        return random.randrange(0, len(possible_children))


    def process_chosen_children(self, chosen_children, expansion):
        """Process children after selection.  By default, does nothing."""
        return chosen_children


########## 扩展策略
    def expand_node(self, node):
        # 默认是随机，可被覆盖以使用不同的策略，扩展节点；
        return self.expand_node_randomly(node)


    def expand_node_randomly(self, node):
        (symbol, children) = node
        assert children is None # 孩子为None，表非终结符占位符，待扩展

        if self.log:
            print("Expanding", all_terminals(node), "randomly") 
            # 所有的叶子节点，这里要扩展的是叶子节点；所以这里，可以这样写；
            # print("Expanding", symbol, "randomly") 

        # Fetch the possible expansions from grammar...
        # 这里每个expansion 转换成 children,都是一个列表；
        # possible_children 是一个列表；里面的元素也是列表；
        expansions = self.grammar[symbol]
        possible_children = [self.expansion_to_children(expansion) for expansion in expansions]

        # ... and select a random expansion
        index = self.choose_node_expansion(node, possible_children)
        chosen_children = possible_children[index]

        # Process children (for subclasses)
        chosen_children = self.process_chosen_children(chosen_children,
                                                       expansions[index])

        # Return with new children
        # 来的时候是(symbol, children),返回的是(symbol, chosen_children)
        return (symbol, chosen_children)  


########################扩展节点策略，考虑代价
class GrammarFuzzer(GrammarFuzzer):
    def symbol_cost(self, symbol, seen=set()):
        # 从一个节点，推到到其衍生出来的叶子节点，都是终结符，经过步长和，当中的最小值
        expansions = self.grammar[symbol]
        return min(self.expansion_cost(e, seen | {symbol}) for e in expansions)


    def expansion_cost(self, expansion, seen=set()):
        # 从一个expansion推到到，其所有的叶子节点，都是终结符，经过的步长和
        symbols = nonterminals(expansion)
        if len(symbols) == 0:
            return 1  # no symbol

        if any(s in seen for s in symbols):
            return float('inf')

        # the value of a expansion is the sum of all expandable variables
        # inside + 1
        return sum(self.symbol_cost(s, seen) for s in symbols) + 1


    def expand_node_by_cost(self, node, choose=min):
        # 扩展节点的时候，考虑代价；
        # choose参数，为指向函数的参数；用以确定，如何从costs列表中选择合适的代价
        (symbol, children) = node
        assert children is None

        # Fetch the possible expansions from grammar...
        expansions = self.grammar[symbol]

        possible_children_with_cost = [(self.expansion_to_children(expansion),
                                        self.expansion_cost(
                                            expansion, {symbol}),
                                        expansion)
                                       for expansion in expansions]

        costs = [cost for (child, cost, expansion)
                 in possible_children_with_cost]
        chosen_cost = choose(costs)
        # python 中 下划线的使用：https://zhuanlan.zhihu.com/p/33866181
        # 两个元素的循环，如果只需要用一个元素，另一个元素最好用_表示，说明这个元素不会被使用，增加代码可读性
        children_with_chosen_cost = [child for (child, child_cost, _) in possible_children_with_cost
                                     if child_cost == chosen_cost]
        expansion_with_chosen_cost = [expansion for (_, child_cost, expansion) in possible_children_with_cost
                                      if child_cost == chosen_cost]

        index = self.choose_node_expansion(node, children_with_chosen_cost)

        chosen_children = children_with_chosen_cost[index]
        chosen_expansion = expansion_with_chosen_cost[index]
        chosen_children = self.process_chosen_children(
            chosen_children, chosen_expansion)

        # Return with a new list
        return (symbol, chosen_children)


    def expand_node_min_cost(self, node):
            if self.log:
                print("Expanding", all_terminals(node), "at minimum cost")

            return self.expand_node_by_cost(node, min)
    

    def expand_node_max_cost(self, node):
        if self.log:
            print("Expanding", all_terminals(node), "at maximum cost")

        return self.expand_node_by_cost(node, max)  



################### 扩展树
class GrammarFuzzer(GrammarFuzzer):
    def possible_expansions(self, node):
        # 统计树中，叶子节点，非终端节点的个数
        (symbol,children) = node
        if children == None:
            return 1
        return sum(self.possible_expansions(c) for c in children)
    

    def any_possible_expansions(self, node):
        # 存在可以拓展的节点（叶子节点，我非终结符），返回true;
        (symbol,children) = node
        if children == None:
            return True
        return any(self.any_possible_expansions(c) for c in children)


    def choose_tree_expansion(self, tree, children):
        """Return index of subtree in `children` to be selected for expansion.  Defaults to random."""
        return random.randrange(0, len(children))

    def expand_tree_once(self, tree):
        """Choose an unexpanded symbol in tree; expand it.  Can be overloaded in subclasses."""
        # 层次的，扩展叶子节点。每次只能扩展一个叶子节点。
        # 但是不得不遍历之前的每一层；这个算法低效？
        # 为啥不每次拓展当前所有的非终结符的叶子节点；使用个队列层次遍历就好。
        (symbol, children) = tree
        if children is None:
            # Expand this node
            return self.expand_node(tree)

        # Find all children with possible expansions
        # 如果该children（子树）存在可以被拓展的节点
        expandable_children = [
            c for c in children if self.any_possible_expansions(c)]

        # `index_map` translates an index in `expandable_children`
        # back into the original index in `children`
        index_map = [i for (i, c) in enumerate(children)
                     if c in expandable_children]

        # Select a random child
        child_to_be_expanded = \
            self.choose_tree_expansion(tree, expandable_children)

        # Expand in place
        # 向下遍历，直到遇到第一个可以拓展的叶子节点。将其拓展，并回归。
        children[index_map[child_to_be_expanded]] = \
            self.expand_tree_once(expandable_children[child_to_be_expanded])

        return tree
    

    def log_tree(self, tree):
        """Output a tree if self.log is set; if self.display is also set, show the tree structure"""
        if self.log:
            print("Tree:", all_terminals(tree))
            if self.disp:
                # display(display_tree(tree))
                # display_tree(tree)
                pass
            # print(self.possible_expansions(tree), "possible expansion(s) left")

    def expand_tree_with_strategy(self, tree, expand_node_method, limit=None):
        """Expand tree using `expand_node_method` as node expansion function
        until the number of possible expansions reaches `limit`."""
        self.expand_node = expand_node_method
        while ((limit is None
                or self.possible_expansions(tree) < limit)
               and self.any_possible_expansions(tree)):
            tree = self.expand_tree_once(tree)
            self.log_tree(tree)
        return tree

    def expand_tree(self, tree):
        """Expand `tree` in a three-phase strategy until all expansions are complete."""
        self.log_tree(tree)
        tree = self.expand_tree_with_strategy(
            tree, self.expand_node_max_cost, self.min_nonterminals)
        tree = self.expand_tree_with_strategy(
            tree, self.expand_node_randomly, self.max_nonterminals)
        tree = self.expand_tree_with_strategy(
            tree, self.expand_node_min_cost)

        assert self.possible_expansions(tree) == 0

        return tree


################ 用以生成模糊测试的输入
class GrammarFuzzer(GrammarFuzzer):
    def init_tree(self,symbol=START_SYMBOL):
        return (symbol,None)

    def fuzz_tree(self):
        # Create an initial derivation tree
        tree = self.init_tree()
        # print(tree)

        # Expand all nonterminals
        tree = self.expand_tree(tree)
        return tree

    def fuzz(self):
        self.derivation_tree = self.fuzz_tree()
        return all_terminals(self.derivation_tree)


if __name__ == "__main__":
    print("test GrammarFuzzer")
    f = GrammarFuzzer(EXPR_GRAMMAR)
    print(f.fuzz())