[toc]

## 前言



### 代码的初始结构

[代码仓库]()，下面的代码在这基础上，不断修改补充。

```shell
➜  jupiter-makefile-ch2 tree
.
├── Makefile
└── src
    ├── main.c
    └── Makefile
```





## 了解autoconf的第一步

这里，我们在初始代码的基础上，添加configure.ac文件。

```shell
➜  jupiter-autoconf-ch3-01 git:(master) ✗ tree                                    
.
├── configure.ac
├── Makefile
└── src
    ├── main.c
    └── Makefile
```

```shell
# configure.ac文件
AC_INIT([Jupiter],[1.0])
AC_OUTPUT
```

<br>

### autoconf

对于autoconf而言，输入是通过宏调用的shell脚本(上面那些宏展开来是shell脚本)。autoconf中使用的宏语言为M4。[configure.ac是autoconf的输入]

宏在与autoconf软件包一起分发的文件中定义。 例如，您可以在Autoconf安装目录（通常为/usr/(local/)share /autoconf）中的autoconf/general.m4文件中找到AC_INIT的定义。AC_OUTPUT在autoconf/status.m4中定义。

> [Autoconf -- wiki](https://zh.wikipedia.org/wiki/Autoconf)
>
> autoconf是一个古老和成熟的产品，如果使用得当，可以使用一个非常简单的接口进行复杂的交叉编译。但是有一些批评指出autoconf使用了过时的技术，因而遗留了很多限制。autoconf无法为Xcode与Visual Studio制作项目文件，其脚本通常大且复杂，因此增加了Debug的难度。Autoconf所使用的M4对于一些开发者来说是陌生的，因此他们需要专门学习[6]。一些开发者并不遵循配置脚本的一些习惯约定[7]。因此一些自由软件开发者开始使用其他软件代替autoconf，KDE于KDE 4起开始使用CMake[8]，Scribus同样开始使用CMake[8]。

调用M4宏，需要满足一些规则

* 以方括号确保参数扩展
* 以逗号分隔的参数列表
* 左括号都必须紧跟其定义中的宏名称，并且中间没有空格
* 如果未传递任何参数，则也可以省略括号
* 多余参数将被忽略

通常，阅读那些宏定义的代码，令人极度不愉快。M4的广泛使用对那些试图理解Autoconf的人造成了相当大的挫败感。幸运的是，能够有效使用Autoconf通常不需要深入了解宏的内部工作原理。

<br>

### 执行

运行autoconf很简单：只需在configure.ac文件所在的目录中执行它即可。 虽然我可以在本章的每个示例中做到这一点，但我将使用autoreconf程序代替autoconf程序，因为运行autoreconf与运行autoconf具有完全相同的效果，只是当您使用autoreconf也会做正确的事情 开始向您的构建系统添加Automake和Libtool功能。 也就是说，它将根据configure.ac文件的内容以正确的顺序执行所有Autotools。

```shell
✗ autoreconf
✗ autoreconf
✗ ls -1p
autom4te.cache/
configure
configure.ac
Makefile
src/
```

我们注意到，autoconf创建一个名为autom4te.cache的目录。 这是autom4te缓存目录。 在连续执行Autotools工具链中的实用程序期间，此缓存可加快对configure.ac的访问。

**configure和configure.ac实质上是相同的文件**，只是将configure.ac中所有宏都已完全展开。 欢迎您看一下configure，不要感到惊讶\^_\^。 通过M4宏扩展，configure.ac文件已转换为包含数千行复杂的Bourne Shell脚本的文本文件。

接下来，我们执行configure文件。

```shell
✗ ./configure
configure: creating ./config.status
✗ tree -L 1
.
├── autom4te.cache
├── config.log
├── config.status
├── configure
├── configure.ac
├── Makefile
└── src
```

configre脚本有三个功能：

* 执行请求的检查。 [检查结果以某种方式写入config.status中]
* 生成然后调用config.status。[config.status从模板（Makefile.in，config.h.in等）生成文件]
* 还会创建一个名为config.log的日志文件:

[上面功能可以看到，configure生成了config.status，然后调用config.status，省去config.status可以好？]

为什么不configure仅执行它写入config.status的代码，而不是麻烦立即生成第二个脚本，而只是立即调用它呢？ 有几个很好的理由。 首先，执行检查和生成文件的操作在概念上是不同的，并且在概念上不同的操作与单独的make目标相关联时，make的效果最佳。 第二个原因是，您可以分别执行config.status以从其相应的模板文件重新生成输出文件，从而节省了执行那些冗长的检查所需的时间。 最后，编写config.status来记住最初在configure命令行上使用的参数。 因此，当make检测到需要更新构建系统时，它可以使用最初指定的命令行选项调用config.status重新执行配置。