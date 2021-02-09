from .GrammarFuzzer import GrammarFuzzer, all_terminals, display_tree
from .Grammars import is_valid_grammar, EXPR_GRAMMAR, START_SYMBOL, crange, is_nonterminal,extend_grammar
from .Grammars import opts, exp_string, exp_opt, set_opts
from .Parser import Parser, EarleyParser, PEGParser
import random

#######给语法指定概率
PROBABILISTIC_EXPR_GRAMMAR = {
    "<start>":
        ["<expr>"],

    "<expr>":
        [("<term> + <expr>", opts(prob=0.1)),
         ("<term> - <expr>", opts(prob=0.2)),
         "<term>"],

    "<term>":
        [("<factor> * <term>", opts(prob=0.1)),
         ("<factor> / <term>", opts(prob=0.1)),
         "<factor>"
         ],

    "<factor>":
        ["+<factor>", "-<factor>", "(<expr>)",
            "<leadinteger>", "<leadinteger>.<integer>"],

    "<leadinteger>":
        ["<leaddigit><integer>", "<leaddigit>"],

    # Benford's law: frequency distribution of leading digits
    "<leaddigit>":
        [("1", opts(prob=0.301)),
         ("2", opts(prob=0.176)),
         ("3", opts(prob=0.125)),
         ("4", opts(prob=0.097)),
         ("5", opts(prob=0.079)),
         ("6", opts(prob=0.067)),
         ("7", opts(prob=0.058)),
         ("8", opts(prob=0.051)),
         ("9", opts(prob=0.046)),
         ],

    # Remaining digits are equally distributed
    "<integer>":
        ["<digit><integer>", "<digit>"],

    "<digit>":
        ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
}

def exp_prob(expansion):
    # 返回给定表达式的概率
    return exp_opt(expansion, attribute='prob')

def set_prob(grammar, symbol, expansion, prob):
    # 给指定的expansion指定概率
    set_opts(grammar, symbol, expansion, opts(prob=prob))


##################### 检查概率的一致性
def exp_probabilities(expansions, nonterminal="<symbol>"):
    # 检查概率和是否为1；
    # 将expansion和概率，建立映射。
    probabilities = [exp_prob(expansion) for expansion in expansions]
    prob_dist = prob_distribution(probabilities, nonterminal)

    prob_mapping = {}
    for i in range(len(expansions)):
        expansion = exp_string(expansions[i])
        prob_mapping[expansion] = prob_dist[i]

    return prob_mapping


def prob_distribution(probabilities, nonterminal="<symbol>"):
    # 检查概率和是否为1。对于缺省的概率，计算出来。
    # 返回expansions的概率。
    epsilon = 0.00001

    number_of_unspecified_probabilities = probabilities.count(None)
    if number_of_unspecified_probabilities == 0:
        assert abs(sum(probabilities) - 1.0) < epsilon, \
            nonterminal + ": sum of probabilities must be 1.0"
        return probabilities

    sum_of_specified_probabilities = 0.0
    for p in probabilities:
        if p is not None:
            sum_of_specified_probabilities += p
    assert 0 <= sum_of_specified_probabilities <= 1.0, \
        nonterminal + ": sum of specified probabilities must be between 0.0 and 1.0"

    default_probability = ((1.0 - sum_of_specified_probabilities)
                           / number_of_unspecified_probabilities)
    all_probabilities = []
    for p in probabilities:
        if p is None:
            p = default_probability
        all_probabilities.append(p)

    assert abs(sum(all_probabilities) - 1.0) < epsilon
    return all_probabilities


def is_valid_probabilistic_grammar(grammar, start_symbol=START_SYMBOL):
    # 检查文法的合法性：文法的合法性+概率的一致性
    if not is_valid_grammar(grammar, start_symbol):
        return False

    for nonterminal in grammar:
        expansions = grammar[nonterminal]
        _ = exp_probabilities(expansions, nonterminal)

    return True


###################### 在节点扩展选择中考虑概率因素
class ProbabilisticGrammarFuzzer(GrammarFuzzer):
    def check_grammar(self):
        super().check_grammar()
        assert is_valid_probabilistic_grammar(self.grammar)

    def supported_opts(self):
        return super().supported_opts() | {'prob'}
    
    def choose_node_expansion(self, node, possible_children):
        (symbol, tree) = node
        expansions = self.grammar[symbol]
        probabilities = exp_probabilities(expansions)

        weights = []
        for child in possible_children:
            expansion = all_terminals((node, child)) # 这里挺好。将树结构存储的孩子节点，变回文法中的字符串结构。
            child_weight = probabilities[expansion]
            if self.log:
                print(repr(expansion), "p =", child_weight)
            weights.append(child_weight)

        if sum(weights) == 0:
            # No alternative (probably expanding at minimum cost)
            weights = None

        return random.choices(
            range(len(possible_children)), weights=weights)[0]



################### 从输入样例中学习概率
def expansion_key(symbol, expansion):
    """Convert (symbol, expansion) into a key.  `expansion` can be an expansion string or a derivation tree."""
    if isinstance(expansion, tuple):
        expansion = expansion[0]
    if not isinstance(expansion, str):
        children = expansion
        expansion = all_terminals((symbol, children))
    return symbol + " -> " + expansion

class ExpansionCountMiner(object):
    def __init__(self, parser, log=False):
        assert isinstance(parser, Parser)
        self.grammar = extend_grammar(parser.grammar())
        self.parser = parser
        self.log = log
        self.reset()

    def reset(self):
        self.expansion_counts = {}

    def add_coverage(self, symbol, children):
        key = expansion_key(symbol, children)

        if self.log:
            print("Found", key)

        if key not in self.expansion_counts:
            self.expansion_counts[key] = 0
        self.expansion_counts[key] += 1


    def add_tree(self, tree):
        (symbol, children) = tree
        if not is_nonterminal(symbol):
            return

        direct_children = [
            (symbol, None) if is_nonterminal(symbol) else (
                symbol, []) for symbol, c in children]
        self.add_coverage(symbol, direct_children)

        for c in children:
            self.add_tree(c)

    def count_expansions(self, inputs):
        for inp in inputs:
            tree, *_ = self.parser.parse(inp)
            self.add_tree(tree)

    def counts(self):
        return self.expansion_counts


################## 将学习出来的概率赋值到文法中
class ProbabilisticGrammarMiner(ExpansionCountMiner):
    def set_probabilities(self, counts):
        for symbol in self.grammar:
            self.set_expansion_probabilities(symbol, counts)

    def set_expansion_probabilities(self, symbol, counts):
        expansions = self.grammar[symbol]
        if len(expansions) == 1:
            set_prob(self.grammar, symbol, expansions[0], None)
            return

        expansion_counts = [
            counts.get(
                expansion_key(
                    symbol,
                    expansion),
                0) for expansion in expansions]
        total = sum(expansion_counts)
        for i, expansion in enumerate(expansions):
            p = expansion_counts[i] / total if total > 0 else None
            # if self.log:
            #     print("Setting", expansion_key(symbol, expansion), p)
            set_prob(self.grammar, symbol, expansion, p)

    def mine_probabilistic_grammar(self, inputs):
        self.count_expansions(inputs)
        self.set_probabilities(self.counts())
        return self.grammar