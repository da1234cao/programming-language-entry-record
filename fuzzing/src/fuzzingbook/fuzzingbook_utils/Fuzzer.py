# 避免重复代码；将Fuzzer类放入该文件

############################# Fuzzer class

# 生成一个指定范围内，随机长度，随机字母的字符串
# 可显示字符[32,126]
import random
def fuzzer(min_length=0,max_length=100, char_start=32, char_range=94):
    str_length = random.randrange(min_length,max_length+1)
    out = ""
    for i in range(str_length):
        out += chr(random.randrange(char_start,char_start+char_range))
    return out

class Runner(object):
    # Test outcomes
    PASS = "PASS"
    FAIL = "FAIL"
    UNRESOLVED = "UNRESOLVED"
    def __init__(self):
        pass
    def run(self,inp):
        return(inp, self.UNRESOLVED)

# 继承Runner类。打印输入
class PrintRunner(Runner):
    def run(self,inp):
        print(inp)
        return(inp, self.UNRESOLVED)

# 继承Runner类
# 把输入发送给程序；程序在创建对象的时候制定
class ProgramRunner(Runner):
    def __init__(self,program):
        self.program = program
    def run_process(self,inp=""):
        return subprocess.run(self.program,
                                input=inp,
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE,
                                universal_newlines=True)
                                # text=True) 我的是3.6版本，还没有text
    def run(self,inp=""):
        result = self.run_process(inp)
        if result.returncode == 0:
            outcome = self.PASS
        elif result.outcome < 0:
            outcome = self.FAIL
        else:
            outcome = self.UNRESOLVED
        return (result,outcome)

# 继承ProgramRunner类
# 如果输入是二进制形式
class BinaryProgramRunner(ProgramRunner):
    def run_process(self,inp=""):
        return subprocess.run(self.program,
                            input=inp.encode(),
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE)

# Fuzzer基类：生成随机输入，并使用run方法运行
class Fuzzer(object):
    def __init__(self):
        pass
    def fuzz(self):
        return ""
    def run(self,runner=Runner()):
        return runner.run(self.fuzz())
    def runs(self,runner=PrintRunner(),trials=10):
        outcomes = []
        for i in range(trials):
            # outcomes.append(runner.run(self.fuzz()))
            outcomes.append(self.run(runner))
        return outcomes

class RandomFuzzer(Fuzzer):
    def __init__(self, min_length=10, max_length=100,char_start=32, char_range=32):
        self.min_length = min_length
        self.max_length = max_length
        self.char_start = char_start
        self.char_range = char_range
    def fuzz(self):
        str_len = random.randrange(self.min_length,self.max_length)
        out = ""
        for i in range(str_len):
            out += chr(random.randrange(self.char_start,self.char_start + self.char_range))
        return out