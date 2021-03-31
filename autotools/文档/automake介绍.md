[toc]

## 前言

---

来源：[AUTOTOOLS - John Calcote](https://nostarch.com/autotools.htm) or [AUTOTOOLS – 亚马逊](https://www.amazon.cn/dp/B003WUYEL6/ref=sr_1_1?__mk_zh_CN=亚马逊网站&dchild=1&keywords=autotools&qid=1616146359&sr=8-1)

这里简单整理下这本书的第四章：automatic makefiles with automake

本章的相关代码见：[jupiter-autoconf-ch5-01](../src/chapter5/jupiter-automake-ch5-01)

<br>

## automake简介

---

makefile的功能(或许大致)可以划分为三部分：编译、测试、安装。

1. 编译(或许包括)：库的编译，预处理，编译链接。
2. 测试：在安装前，对编译完成的程序进行简单的测试。
3. 安装：将(可执行程序、脚本、头文件、库、文档等)文件复制到适当的位置，并赋予适当的权限。

makefile可以纯手工构建，但是存在“进化”的空间。

autoconf的工作：为了完成跨平台的需求，根据实际安装环境，使用脚本替换makefile中的变量。

此时，makefile的生成工作能否再“进化”一些？

makefile描述了编译、测试、安装的过程。这个过程思路可能没法改进了，因为确实需要做这些事情。

<font color=blue>但，由于GCS对于应如何构建和测试项目产品以及在何处构建，测试和安装相当明确。所以描述的方式可以简化。automake便是做了这件工作。同时，Automake为我们做了很多完善工作。</font>

本章最基础重要的代码结构如下：

```shell
.
├── common
│   ├── jupcommon.h
│   ├── Makefile.am
│   └── print.c
├── configure.ac
├── Makefile.am
└── src
    ├── main.c
    └── Makefile.am
```

在[autotools简介](https://blog.csdn.net/sinat_38816924/article/details/115015188#t9)中，我们已经知道Makefile.am的作用。

> automake：automake程序从高级构建规范文件（名为Makefile.am）生成标准的Makefile模板（名为Makefile.in）
>
> configure：将从Makefile.in中生成makefile文件

<br>

## Enabling Automake in configure.ac

为了在构建系统中启用Automake，我添加了一行代码configure.ac：在对AC_INIT和AC_CONFIG_SRCDIR的调用之间对AM_INIT_AUTOMAKE的调用。

```shell
...
AC_INIT([Jupiter], [1.0], [jupiter-bugs@example.org])
AM_INIT_AUTOMAKE
AC_CONFIG_SRCDIR([src/main.c])
...
```

AM_INIT_AUTOMAKE宏接受一个可选参数：用空格分隔的选项标签列表，可以将其传递到此宏中，以修改Automake的常规行为。  有关每个选项的详细说明，请参见GNU Automake手册。但是，我将在此处指出一些最有用的选项。

1. **check-news**：如果项目的当前版本（来自configure.ac）没有出现在NEWS文件的前几行中，则check-news选项会使make dist失败。
2. **dist-bzip2, dist-lzma, dist-shar, dist-zip, dist-tarZ**：您可以使用dist- *选项更改默认分发程序包类型。 默认情况下，make dist会生成一个.tar.gz文件，但是开发人员经常想分发例如.tar.bz2软件包。 这些选项使更改变得非常容易。  （即使没有dist-bzip2选项，也可以使用make distbzip2覆盖当前的默认值，但是如果始终要构建.bz2软件包，则使用该选项会更简单。）
3. **readme-alpha**：readme-alpha选项在项目alpha release期间临时更改了构建和分发过程的行为。 使用此选项会使在项目根目录中找到的名为README-alpha的文件自动分发。 使用此选项还可以更改项目的预期版本控制方案。
4. **-Wcategory, --warnings=category**：-Wcategory和--warnings = category选项指示项目希望在启用各种警告类别的情况下使用Automake。 多个这样的选项可以与不同的类别标签一起使用。 请参阅《 GNU Automake手册》以找到有效类别的列表。
5. **silent-rules**：静默规则功能使Automake生成生成文件，该文件允许用户指定在生成过程中仅将工具名和输出文件名发送到stdout。 
6. **parallel-tests**：并行测试功能允许并行执行检查，以便在执行检查目标期间利用多处理器计算机。
7. **version**：版本选项实际上是版本号的占位符，该版本号表示该项目可接受的最低版本的Automake。 

<br>

## Makefile.am文件

---

Automake Makefile.am文件只不过是带有其他特定于Automake语法的标准makefile。

autoconf和automake的区别在于：autoconf接受的输入是configure.ac中存在的shell脚本和M4宏，输出是shell脚本和M4宏的展开；<font color=blue>Automake假定除了您指定的任何目标和变量之外，所有makefile都应包含旨在支持GCS的最小基础结构</font>。

由于make实用程序使用一组相当严格的规则来处理makefile，Makefile.am中自行添加的makefile内容，将会和自动生成的makefile内容，以合理的方式处于同一个文件中。具体来说，如下：

* 将在Makefile.am文件中定义的make变量放置在生成的Makefile.in模板的顶部，紧随任何由Automake生成的变量定义之后。
* 将在Makefile.am文件中指定的make规则放置在生成的Makefile.in模板的末尾，紧随任何由Automake生成的规则之后。 
* 大多数由config.status替换的Autoconf变量都将转换为make变量，并初始化为这些替换变量。

Makefile.am文件中内容如下所示，后面会逐行分析其含义。

```makefile
# 顶层的makefile.am
SUBDIRS = common src
```

```makefile
# 临时库所在目录的makefile.am
noinst_LIBRARIES = libjupcommon.a
libjupcommon_a_SOURCES = jupcommon.h print.c
```

```makefile
# 目标源代码所在目录的makefile.am
bin_PROGRAMS = jupiter
jupiter_SOURCES = main.c

# jupiter_CPPFLAGS = -I$(top_srcdir)/common
jupiter_CPPFLAGS = -I../common
jupiter_LDADD = ../common/libjupcommon.a

check_SCRIPTS = greptest.sh
TESTS = $(check_SCRIPTS)

greptest.sh:
	echo './jupiter | grep "Hello from .*jupiter!"' > greptest.sh
	chmod +x greptest.sh

CLEANFILES = greptest.sh
```

<br>

### 顶层的Makefile.am

```shell
SUBDIRS = common src
```

这一行告诉Automake关于我们项目的几件事：

* 指定一个或多个子目录。这些目录包含makefile，并将要被处理。
* 以空格分隔的列表中的目录应按照指定的顺序进行处理。
* 对于所有primary targets，应递归处理此列表中的目录。
* 除非另有说明，否则此列表中的目录应视为项目分发的一部分。

<br>

### Product List Variables

在目标源代码所在目录的makefile.am中，main.c是源码，jupiter是我们需要生成的product。

```shell
bin_PROGRAMS = jupiter
```

<font color=blue>PLV(Product List Variables)名称由两个部分组成</font>：prefix(eg, bin)和PRIMARY(eg, PROGRAMS)，用下划线分隔。 该变量的值是此Makefile.am文件生成的product的空格分隔列表。

以下模板显示了PLV的常规格式：

```shell
[modifier-list]prefix_PRIMARY = product1 product2 ... productN
```

#### 安装位置前缀

make变量中，以dir结尾的，符合GCS的位置，都可以作为安装位置，比如\$(bindir)对应的位置。

通过省略变量名称的dir部分，可以在PLV前缀中引用安装位置变量。 例如，上面，\$(bindir) 的make变量在用作安装位置前缀时称为bin。[<font color=blue>bin前缀表示安装在make变量​\$(bindir)的位置</font>。]

Automake还可以识别以特殊前缀pkg开头的四个安装位置变量：pkglibdir，pkgincludedir，pkgdatadir和pkglibexecdir。libdir，includedir，datadir和libexecdir变量的这些pkg版本表示应将列出的产品安装在以软件包命名的这些位置的子目录中。 

举例说明：在Jupiter项目中，PLV中以lib开头的产品将被安装到\$(libdir)中，而PLVlib中以pkglib开头的产品将被安装到\$(libdir)/ jupiter中。

由于Automake从所有以dir结尾的make变量中获取有效安装位置和前缀的列表，因此您可以提供自己的PLV前缀，以引用自定义安装位置。

```makefile
xmldir = $(datadir)/xml
xml_DATA = file1.xml file2.xml file3.xml ...
```

#### 与安装无关的前缀

某些前缀与安装位置无关。 例如，分别使用noinst，check和EXTRA表示不安装，仅用于测试或可选地构建的产品。 以下是有关这三个前缀的更多信息：

1. **noinst**前缀指示应构建但不安装列出的产品。 例如，可以将静态的所谓的convenience library构建为中间产品，然后在构建过程的其他阶段使用它来构建最终产品。noinst前缀告诉Automake不应安装该产品，而只能构建一个静态库。
2. **check**前缀表示将仅出于测试目的而构建的产品，因此将不需要安装它们。仅当用户输入make check时，才会构建PLV中带有check前缀的产品。
3. The **EXTRA** prefix is used to list programs that are conditionally built。  Automake要求在Makefile.am文件中静态地指定所有源文件，而不是在构建过程中进行计算或派生，因此它可以生成适用于任何可能命令行的Makefile.in模板。 但是，项目维护者可以选择允许根据配置脚本提供的配置选项有条件地构建某些产品。 如果产品在配置脚本生成的变量中列出，则它们还应在Makefile.am文件中的PLV中以EXTRA前缀列出。 

#### Primaries

上面介绍了PLV的prefixs。这里来介绍PLV的primaries。

primaries类似于产品类，它们表示可能由构建系统生成的产品类型。 一个primary定义了构建，测试，安装和执行特定类产品所需的一组步骤。 例如，使用不同的编译器和链接器命令构建程序和库，Java类需要虚拟机来执行它们，而Python程序需要解释器。 某些产品类（例如脚本，数据和标头）没有构建，测试或执行语义-仅具有安装语义。

全面了解Automake primaries是正确使用Automake的关键。 一些最重要的原语如下。

1. **PROGRAMS**：在PLV中使用PROGRAMS原语时，Automake会生成使用编译器和链接器为列出的产品构建二进制可执行程序的生成规则。
2. **LIBRARIES / LTLIBRARIES**：使用LIBRARIES原语会使Automake生成规则，这些规则使用系统编译器和库管理器来构建静态库。  LTLIBRARIES原语导致执行相同的操作，但是生成的规则还会构建Libtool共享库，并通过libtool脚本执行这些工具（以及链接程序）。Automake限制LIBRARIES和LTLIBRARIES主数据库的安装位置：它们只能安装在\$(libdir)和\$(pkglibdir)中。
3. **PYTHON**：Python是一种解释性语言；  python解释器将Python脚本逐行转换为Python字节代码，并在转换后执行它，因此（如shell脚本）Python源文件可以按编写的方式执行。 使用PYTHON primary会告诉Automake生成规则，以便使用py-compile实用程序将Python源文件（.py）预编译为标准（.pyc）和优化（.pyo）字节编译版本。   由于Python源代码通常具有解释性，因此此编译发生在安装时而不是构建时。
4. **JAVA**：Java是一个虚拟机平台。  JAVA primary的使用会告诉Automake生成规则，以使用javac编译器将Java源文件（.java）转换为Java类文件（.class）。 尽管此过程是正确的，但仍未完成。  Java程序（有任何后果）通常包含一个以上的类文件，这些类文件通常打包为.jar或.war文件，这两个文件也可能都包含多个辅助文本文件。  JAVA原语很有用，但仅此而已。  
5. **SCRIPTS**：在这种情况下，Script指的是任何解释后的文本文件-无论是shell，Perl，Python，Tcl / Tk，JavaScript，Ruby，PHP，Icon，Rexx还是其他文件。  Automake为SCRIPTS原语提供了一组受限制的安装位置，包括\$(bindir)，\$(sbindir)，\$(libexecdir)和\$(pkgdatadir)。 尽管Automake不会生成生成脚本的规则，但也不会假定脚本是项目中的静态文件。 脚本通常是由Makefile.am文件中的手写规则生成的，有时是通过使用sed或awk实用程序处理输入文件而生成的。 因此，脚本不会自动分发。 如果您的项目中有一个静态脚本，您希望Automake将其添加到发行包中，则应在SCRIPTS主变量前添加dist修饰符。
6. **DATA**：可以使用PLV中的DATA原语安装任意数据文件。  Automake允许DATA原语使用一组受限制的安装位置，包括\$(datadir)，\$(sysconfdir)，​\$(sharedstatedir)，\$(localstatedir)和​\$(pkgdatadir)。 数据文件不会自动分发，因此，如果您的项目包含静态数据文件，请使用DATA主数据库上的dist修饰符。
7. **HEADERS**：头文件是源文件的一种形式。 可以将它们与产品来源一起列出。 包含已安装库产品的公共接口的头文件将安装到\$(includedir)或\$(pkgincludedir)定义的特定于包的子目录中，因此，此类已安装头的最常见PLV是include_HEADERS和pkginclude_HEADERS变量。 与其他源文件一样，头文件会自动分发。
8. **MANS**：手册页是包含troff标记的UTF-8文本文件，当用户查看时，该页面由man呈现。 手册页可以使用man_MANS或manN_MANS产品列表变量进行安装，其中N表示段号在0到9之间的一个数字。man_MANS PLV中的文件应具有数字扩展名，以指示它们所属的man节及其目标目录。manN_MANS PLV中的文件可以使用数字扩展名或.man扩展名来命名，当通过make install安装它们时，它们将被重命名为关联的数字扩展名。 由于通常会生成手册页，因此默认情况下不会分发项目手册页，因此您应该使用dist修饰符。
9. **TEXINFOS**：当涉及到Linux或Unix文档时，Texinfo [72]是首选的GNU项目格式。  makeinfo实用程序接受Texinfo源文件（.texinfo，.txi或.texi），并呈现包含以Texinfo标记注释的UTF-8文本的信息文件（.info），info实用程序将其呈现为用户的格式化文本。 与Texinfo源一起使用的最常见的产品列表变量是info_TEXINFOS。 使用此PLV会使Automake生成规则来构建.info，.dvi，.ps和.html文档文件。 但是，只有.info文件是使用make all构建的，并使用make install进行安装的。 为了构建其他类型的文件，必须在make命令行上显式指定dvi，ps，pdf，html，install-dvi，install-ps，install-pdf和install-html目标。 由于在许多Linux发行版中默认未安装makeinfo实用程序，因此生成的.info文件会自动添加到发行包中，因此您的最终用户将不必去寻找makeinfo

<br>

### Product Source Variables

在目标源代码所在目录的makefile.am中，main.c是源码，jupiter是我们需要生成的product。

```shell
jupiter_SOURCES = main.c
```

PSV(Product Source Variables)符合以下模板：

```shell
[modifier-list]product_SOURCES = file1 file2 ... fileN
```

<font color=blue>与PLV一样，PSV由多个部分组成：product和SOURCES标签</font>。  PSV的值是用空格分隔的用于生成product的源文件列表。  最终，Automake将这些文件添加到生成的Makefile.in模板中的各种make规则依赖项列表和命令中。

product只可以是字母、数字、@符号。如果出现其他符号，automake会将其装换为下划线。

<br>

### PLV and PSV Modifiers

修饰符(modifier)可更改其前缀的变量的正常行为。 一些更重要的是dist，nodist，nobase和notrans。

1. **dist**修饰符：指示应分发的一组文件（即，应包含在执行make dist时构建的分发包中）
2. **nobase**修饰符：Automake通常会从HEADERS PLV中的头文件列表中删除相对路径信息。 使用nobase修饰符可阻止，当Makefile.am文件从子目录获得头文件时删除路径信息。 [保留头文件的目录结构]
3. **notrans**修饰符可用于手册页PLV上，其手册页的名称在安装过程中不应进行转换。（通常，Automake会生成规则以将手册页上的扩展名从.man重命名为.N（其中N为0、1，..   ，9）。

<br>

### 测试单元

```makefile
check_SCRIPTS = greptest.sh
TESTS = $(check_SCRIPTS)

greptest.sh:
	echo './jupiter | grep "Hello from .*jupiter!"' > greptest.sh
	chmod +x greptest.sh

CLEANFILES = greptest.sh
```

* make check的时候，构建此脚本。
* CLEANFILES在make clean期间，删除文件列表。
* TESTS指示，make check的时候，哪些目标被执行

<br>

### 便捷库

便捷库是仅在包含项目中使用的静态库。当项目中的多个二进制文件需要合并相同的源代码时，通常使用此类临时库。[因而此类库也不在打包范围内。]

这里是便捷库的Makefile.am。

```makefile
noinst_LIBRARIES = libjupcommon.a
libjupcommon_a_SOURCES = jupcommon.h print.c
```

源码所使用的Makefile.am也需要添加相应的内容，以使在编译的时候链接到该库。

```makefile
jupiter_CPPFLAGS = -I../common
jupiter_LDADD = ../common/libjupcommon.a
```

jupiter_CPPFLAGS和jupiter_LDADD这两个新变量是从程序名称派生的。

<font color=blue>这些 product option variables(POV)用于为用于从源代码构建产品的工具指定特定于产品的选项</font>。[jupiter_SOURCES中的SOURCES表示源，不是选项的意思]

您可以在GNU Autoconf手册中找到程序和库option variables的完整列表，但这是一些重要的变量。

1. **product_CPPFLAGS**：使用product_CPPFLAGS在编译器命令行上将标志传递给C preprocessor
2. **product_CFLAGS**：使用product_CFLAGS在编译器命令行上传递C-compiler flags
3. **product_LDFLAGS**：使用product_LDFLAGS可以将全局的和顺序无关的共享库和程序链接器配置标志以及选项传递给链接器，包括-static，-version-info，release等。
4. **program_LDADD**：使用library_LIBADD在ar实用程序命令行上将非Libtool链接器对象和档案添加到非Libtool档案中。  ar实用程序会将命令行中提到的存档合并到产品存档中，因此您可以使用此变量将多个存档收集在一起。
5. **ltlibrary_LIBADD**：使用ltlibrary_LIBADD将Libtool链接器对象（.lo）和Libtool静态或共享库（.la）添加到Libtool静态或共享库中。

最后，需要在configure.ac中添加`AC_PROG_RANLIB`宏。

为什么添加这个宏，书上给了如下解释。我不理解，暂时跳过。

> There's a lot of history behind the use of the ranlib utility on archive libraries. I won't get into whether it's still useful with respect to modern development tools, but I will say that whenever you see it used in modern makefiles, there always seems to be a preceding comment about running ranlib "in order to add karma" to the archive, implying that the use of ranlib is somehow unnecessary. You be the judge.

<br>

## 其他

---

### Distribution

Automake通常会自动确定应使用make dist创建的发行版中应包含的内容，因为它非常了解构建过程中每个文件的角色。 为此，Automake希望被告知用于构建产品的每个源文件以及安装的每个文件和产品。 当然，这意味着所有文件都必须在一个或多个PLV和PSV变量中指定。

automake不会自动添加的内容，而我们希望天剑，可以使用EXTRA_DIST的方式手动添加。

```makefile
# 将本不会自动添加的windows目录，添加大Distribution中
EXTRA_DIST = windows
```

<br>

## 执行

---

先创建一些必要的文件，否则autoreconf会提示缺少文件。

至于这些文件的含义，该书将其放在后续章节介绍，这里就暂时不理会这些文件的作用。

```shell
# autoreconf，提示文件没有发现。
Makefile.am: error: required file './NEWS' not found
Makefile.am: error: required file './README' not found
Makefile.am: error: required file './AUTHORS' not found
Makefile.am: error: required file './ChangeLog' not found

# 创建必要的文件
➜  touch NEWS README AUTHORS ChangeLog
```

我们使用-i选项运行autoreconf以便添加Automake可能需要用于我们项目的任何新实用工具文件

```shell
➜  autoreconf -i\
➜  tree -L 1
.
├── aclocal.m4
├── AUTHORS
├── autom4te.cache
├── ChangeLog
├── common
├── compile
├── config.h.in
├── configure
├── configure.ac
├── COPYING
├── depcomp
├── INSTALL
├── install-sh
├── Makefile.am
├── Makefile.in
├── missing
├── NEWS
├── README
├── src
└── test-driver
```

接着是常见的三步走。

```shell
./configure --enable-silent-rules
make
# make install
```

其中`./configure --enable-silent-rules`是静默规则，默认是禁用的。[更多[静默规则](https://www.gnu.org/software/automake/manual/html_node/Automake-Silent-Rules.html)]

如果想打包，`make dist`就成。

<br>

## 总结

总的来说，我开始有点喜欢automake了。

在PLV中：指定需要处理的文件类型和处理之后的安装位置 = product。

在PLS中：product_SOURCES = 源码位置

在POV中：product_选项 = 选项内容，表示从源码编译生成product所需要的参数。