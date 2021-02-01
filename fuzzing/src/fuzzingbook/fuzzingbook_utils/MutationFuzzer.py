#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# This material is part of "The Fuzzing Book".
# Web site: https://www.fuzzingbook.org/html/MutationFuzzer.html
# Last change: 2019-10-29 09:36:33+01:00
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


# # Mutation-Based Fuzzing
# 自行手敲这里的代码

import random

# 突变函数
def delete_random_character(s):
    """在原字符串的基础上随机删除一个字符，并返回；原字符串不变"""
    if s == "":
        return s
    pos = random.randint(0,len(s)-1)
    return s[:pos] + s[pos+1:]

def insert_random_character(s):
    """在原字符串的基础上随机插入一个字符，并返回；原字符串不变"""
    pos = random.randint(0,len(s)-1)
    # randint 左右闭区间，randrange左闭右开
    # randrange()功能相当于 choice(range(start, stop, step))
    random_char = chr(random.randrange(32,127)) 
    return s[:pos] + random_char + s[pos:]

def flip_random_character(s):
    """在原字符串的基础上随机翻转一个bit，并返回；原字符串不变"""
    if s == "":
        return s
    pos = random.randint(0,len(s)-1)
    c = s[pos]
    bit = 1 << random.randint(0,6) # 注意这里只有七个位置可能翻转
    new_c = chr(ord(c)^bit)
    return  s[:pos] + new_c + s[pos+1:]

def mutate(s):
    """随机选择一个突变方式"""
    mutators = [
        delete_random_character,
        insert_random_character,
        flip_random_character
    ]
    # print(type(mutators[0])) # 这里面存储的是函数类型，有意思
    matator = random.choice(mutators)
    return matator(s)


from Fuzzer import Fuzzer,Runner

class MutationFuzzer(Fuzzer):
    def __init__(self,seed, min_mutations=2,max_mutations=10):
        self.seed = seed
        self.min_mutations = min_mutations
        self.max_mutations = max_mutations
        self.reset()
    
    def reset(self):
        self.population = self.seed
        self.seed_index = 0
    
    def mutate(self,inp):
        return mutate(inp)
    
    # 从仓库中随机选择一个进行突变；
    # 仓库使用种子进行初始化（__init__中完成）
    # 这里并没有将突变生成的内容放入population
    def create_candidate(self):
        candidate = random.choice(self.population)
        trails = random.randint(self.min_mutations,self.max_mutations)
        for i in range(trails):
            candidate = self.mutate(candidate)
        return candidate
    
    def fuzz(self):
        if self.seed_index < len(self.seed):
            # 使用种子
            self.inp = self.seed[self.seed_index]
            self.seed_index += 1
        else:
            # 使用突变生成的内容
            self.inp = self.create_candidate()
        return self.inp


from Coverage import Coverage,population_coverage

class FunctionRunner(Runner):
    def __init__(self,function):
        self.function = function
    
    def run_function(self,inp):
        return self.function(inp)
    
    def run(self,inp):
        try:
            result = self.run_function(inp)
            outcome = self.PASS
        except Exception:
            result = None
            outcome = self.FAIL
        return result,outcome

class FunctionCoverageRunner(FunctionRunner):
    def run_function(self,inp):
        with Coverage() as cov:
            try:
                result = super().run_function(inp)
            except Exception as exc:
                self._coverage = cov.coverage()
                raise exc
        self._coverage = cov.coverage()
        return result
    
    def coverage(self):
        return self._coverage

class MutationCoverageFuzzer(MutationFuzzer):
    def reset(self):
        super().reset()
        self.coverages_seen = set()
        # Now empty; we fill this with seed in the first fuzz runs
        self.population = []

    def run(self, runner):
        """Run function(inp) while tracking coverage.
           If we reach new coverage,
           add inp to population and its coverage to population_coverage
        """
        result, outcome = super().run(runner)
        new_coverage = frozenset(runner.coverage())
        if outcome == Runner.PASS and new_coverage not in self.coverages_seen:
            # We have new coverage
            self.population.append(self.inp)
            self.coverages_seen.add(new_coverage)
    
        return result