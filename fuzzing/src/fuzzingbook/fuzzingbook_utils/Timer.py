# 官方的代码写的很好，读起来很有收获，我这里敲一遍

# python time 模块：https://docs.python.org/3/library/time.html

# 事实上，当我们向文件导入某个模块时，导入的是该模块中那些名称不以下划线（单下划线“_”或者双下划线“__”）开头的变量、函数和类。
# 因此，如果我们不想模块文件中的某个成员被引入到其它文件中使用，可以在其名称前添加下划线。

# 在普通模块中使用时，表示一个模块中允许哪些属性可以被导入到别的模块中
# 或许这是一个不错的东西，可以直观看到哪些内容会被导入到别的模块
# 仅对模糊导入时起到作用。如：from xxx import *
# __all__ = ["Timer"]
# 与__init__搭配比较好看

if __name__ == "__main__":
    print("\n# Timer")

if __name__ == "__main__":
    print("\n## Synopsis")


import time

def clock():
    try:
        return time.perf_counter() # python3 包含睡眠期间经过的时间
        # return time.process_time() # python3
    except:
        return time.clock() # python 2 返回当前处理器时间

class Timer(object):
    def __enter__(self):
        self.start_time = clock()
        self.stop_time = None
        return self

    def __exit__(self, exc_type, exc_value, tb):
        self.stop_time = clock()

    def elapsed_time(self):
        """Return elapsed time in seconds"""
        if self.stop_time == None:
            # still run
            return clock() - self.start_time
        else:
            return self.stop_time - self.start_time


# test class Timer()
if __name__ == "__main__":
    print("\n## test class Timer()")

def run_circle():
    i = 1000000
    while i > 0:
        i -= 1

if __name__ == "__main__":
    print("\n all spend time:")
    with Timer() as t:
        run_circle()
    print(t.elapsed_time())

if __name__ == "__main__":
    with Timer() as t:
        i = 10
        while i > 0:
            i -= 2
            print(f"\n middle spend time {t.elapsed_time()}")

if __name__ == "__main__":
    print("\n## Synopsis")