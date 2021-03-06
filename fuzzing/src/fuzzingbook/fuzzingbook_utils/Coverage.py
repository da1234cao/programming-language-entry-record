#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# This material is part of "The Fuzzing Book".
# Web site: https://www.fuzzingbook.org/html/Coverage.html
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


# # Code Coverage

# 自行手敲这里的代码

import sys

class Coverage(object):
    # 代码写的很好:
    # 如果原来的代码已经settrace,在原来trace函数的基础上，添加获取覆盖率的代码；退出之后，仍然使用原来的trace函数
    # 如果原来的代码没有settrace,我们设置的trace仅获取代码覆盖率；退出之后，trace函数的位置设置为None
    def traceit(self,frame,event,arg):
        if self.origin_trace_function is not None:
            self.origin_trace_function(frame,event,arg)
        if event == "line":
            function_name = frame.f_code.co_name
            lineno = frame.f_lineno
            self._trace.append((function_name, lineno))
        return self.traceit
    
    def __init__(self):
        self._trace = []

    def __enter__(self):
        self.origin_trace_function = sys.gettrace()
        sys.settrace(self.traceit)
        return self
    
    def __exit__(self,exc_type, exc_value, tb):
        sys.settrace(self.origin_trace_function)
    
    def trace(self):
        return self._trace
    
    def coverage(self):
        return set(self.trace())


def population_coverage(population, function):
    cumulative_coverage = []
    all_coverage = set()

    for s in population:
        with Coverage() as cov:
            try:
                function(s)
            except:
                pass
        all_coverage |= cov.coverage()
        cumulative_coverage.append(len(all_coverage))
    
    return all_coverage,cumulative_coverage