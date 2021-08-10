[toc]

## 背景

[GCC中实现的C++标准库](https://blog.csdn.net/sinat_38816924/article/details/119207217#t3)中[__cplusplus](https://github.com/gcc-mirror/gcc/blob/master/libstdc%2B%2B-v3/include/bits/allocator.h#L48)是一个很常见的宏。

弄清这个宏之前，我们需要先明白**编程语言和编译器之间的关系**。C++是一门编程语言，它有其[标准](https://isocpp.org/std)。而[编译C++代码的编译器](https://isocpp.org/get-started)有多种，如常见的[Gnu Compiler Collection](http://gcc.gnu.org/)、[Clang](http://clang.llvm.org/get_started.html)、[Visual C++ 2017 Community](https://www.visualstudio.com/vs/cplusplus/)。不同的C++编译器需要遵守/支持C++的标准。

了解上述背景之后，我们来查看`__cplusplus`宏在C++标准的要求和编译器中的定义。

<br>

## C++标准和编译器中的预定义宏

鉴于C++的标准文档[需要收费](https://stackoverflow.com/questions/81656/where-do-i-find-the-current-c-or-c-standard-documents)，我们在[cppreference](https://en.cppreference.com/w/cpp/preprocessor/replace)中查看关于`__cplusplus`的标准信息。

```shell
# 标准规定支持该宏
__cplusplus
denotes the version of C++ standard that is being used, expands to value 199711L(until C++11), 201103L(C++11), 201402L(C++14), 201703L(C++17), or 202002L(C++20)
(macro constant)
```

我使用的是Ubuntu系统，所以我们查看下[GCC标准预定义宏](https://gcc.gnu.org/onlinedocs/cpp/Standard-Predefined-Macros.html)。关于windows系统中`__cplusplus`宏定义的查看，可参考[/Zc:__cplusplus（启用更新的 __cplusplus 宏](https://docs.microsoft.com/zh-cn/cpp/build/reference/zc-cplusplus?view=msvc-160)

```shell
# GCC遵守C++标准支持该宏
__cplusplus
This macro is defined when the C++ compiler is in use. You can use __cplusplus to test whether a header is compiled by a C compiler or a C++ compiler. This macro is similar to __STDC_VERSION__, in that it expands to a version number. Depending on the language standard selected, the value of the macro is 199711L for the 1998 C++ standard, 201103L for the 2011 C++ standard, 201402L for the 2014 C++ standard, 201703L for the 2017 C++ standard, 202002L for the 2020 C++ standard, or an unspecified value strictly larger than 202002L for the experimental languages enabled by -std=c++23 and -std=gnu++23.
```

这里，我们知道`__cplusplus`宏的含义是“C++的版本“。接下来我们查看当前系统该宏的值是多少。

<br>

## 查看__cplusplus宏定义的值

参考[Which C++ standard is the default when compiling with g++?](https://stackoverflow.com/questions/44734397/which-c-standard-is-the-default-when-compiling-with-g)，我们使用下面命令查看宏的值。

```shell
# 输出编译器预定义的宏，grep进行过滤
➜  g++ -dM -E -x c++  /dev/null | grep -F __cplusplus
#define __cplusplus 201402L
```

关于GCC的命令行参数，可通过[GCC手册](https://gcc.gnu.org/onlinedocs/gcc-9.3.0/gcc/)查看。上面的参数含义如下：

```shell
-dM -E # 输出预定义的宏
Instead of the normal output, generate a list of ‘#define’ directives
for all the macros defined during the execution of the preprocessor,
including predefined macros. This gives you a way of finding out
what is predefined in your version of the preprocessor. 
If you use ‘-dM’ without the ‘-E’ option, ‘-dM’ is interpreted as a
synonym for ‘-fdump-rtl-mach’

-E # 预处理之后停止，预处理的结果输出到标准输出
Stop after the preprocessing stage; do not run the compiler proper. The output
is in the form of preprocessed source code, which is sent to the standard output.
Input files that don’t require preprocessing are ignored

-x language # 指定语言
Specify explicitly the language
```

我们已经知道该宏的值，那这个宏在哪里/何时定义的呢？

<br>

## __cplusplus宏定义的位置

结论：**我暂时不知道，如果你知道的话，可以评论区留言**。

我知道[c++config](https://github.com/gcc-mirror/gcc/blob/master/libstdc%2B%2B-v3/include/bits/c%2B%2Bconfig)用于预定义C++库的宏。但是编译器预定义的宏的位置在哪呢？(或者说，这些宏本身的创建过程是什么样子的？)

我下载了[GCC源码](https://github.com/gcc-mirror/gcc)，它使用[autotools](https://blog.csdn.net/sinat_38816924/category_10907321.html)进行构建。我企图从这里找到答案。我使用关键字在源代码中进行搜素，但是并没有找到答案。

<br>

## 参考

[Where do I find the current C or C++ standard documents?](https://stackoverflow.com/questions/81656/where-do-i-find-the-current-c-or-c-standard-documents)

[What does the “__cplusplus” macro expand to?](https://stackoverflow.com/questions/49915424/what-does-the-cplusplus-macro-expand-to)

[Which C++ standard is the default when compiling with g++?](https://stackoverflow.com/questions/44734397/which-c-standard-is-the-default-when-compiling-with-g)