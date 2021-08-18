<font color=red>本文翻译</font>：[Copy, load, redirect and tee using C++ streambufs](http://wordaligned.org/articles/cpp-streambufs)

**有些地方我没看懂，没有翻译，详见原文**。

在这之前，建议基本了解《C++ Primer》第八章I/O库的使用。

|                            头文件                            |             类型             |
| :----------------------------------------------------------: | :--------------------------: |
| [iostream](https://zh.cppreference.com/w/cpp/header/iostream) |       istream、ostream       |
| [fstream](https://zh.cppreference.com/w/cpp/header/fstream)  |      ifstream、ofstream      |
| [sstream](https://zh.cppreference.com/w/cpp/header/sstream)  | istringstream、ostringstream |

```c++
typedef basic_streambuf<char> 	streambuf;
typedef basic_istream<char> 	istream;
typedef basic_ostream<char> 	ostream;
```

![继承图](C++使用streambufs实现输入输出的复制、加载、重定向和tee.assets/继承图.png) 

这里再补充下**streambuf和这些I/O操作之间的关系**。

> 类模板 [basic_iostream](https://zh.cppreference.com/w/cpp/io/basic_iostream) 提供流上的高层输入/输出支持。受支持操作包含读或写及格式化。此功能为 `basic_streambuf` 类所提供，在接口上实现。通过 `basic_ios` 类访问缓冲区。 

对于API最常见的使用方式是，直接调用接口，使用接口功能。下方streambufs实现输入/输出的复制、加载、重定向，即属于这一类。

复杂些的API使用是，改写接口，泛生成同一族不同类型的新API。这要求掌握API的内部结构，适当的继承覆盖。下方streambufs实现输入/输出的tee，即属于这一类。

<br>

## 前言

```c++
out << std::setw(3) << place << ". "
    << "Name " << name
    << ", Score " 
    << std::fixed << std::setprecision(2) 
    << score << '\n';

fprintf(out, "%3d. Name %s, Score %.2f\n", 
        place, name, score);
```

我不是唯一一个发现 iostream 格式[有点](http://www.fastformat.org/) [笨拙的人](http://www.boost.org/doc/libs/1_39_0/libs/format/index.html)，但输入/输出不仅仅是格式。例如，还有缓冲和同步。iostream 库的一个被低估的特性是<font color=blue>将低级读取和写入操作委托给单独的流缓冲区对象</font>。

C++ 流允许直接访问其底层缓冲区。您可以自定义这些缓冲区。你会发现成员函数的名字，甚至听起来像汇编指令：`egptr`，`xsputn`，`pbump`，`epptr`。

<font color=red>本文的其余部分将介绍一些使用`std::streambuf` 复制、加载、重定向和 tee 流的示例</font>。

<br>

## 示例

### Copy streams

```c++
void stream_copy(std::ostream & dst, std::istream & src)
{
    dst << src.rdbuf();
}
```

[std::basic_ios<CharT,Traits>::rdbuf](https://zh.cppreference.com/w/cpp/io/basic_ios/rdbuf) 返回关联的流缓冲。若无关联流缓冲，则返回空指针。

[std::basic_ostream<CharT,Traits>::operator<<](https://zh.cppreference.com/w/cpp/io/basic_ostream/operator_ltlt) 插入数据到流（9）。

<br>

### Load streams

```c++
// Return a named file's contents as a string
std::string load_file(char const * filepath)
{
    std::ifstream src(filepath);
    std::ostringstream buf;
    buf << src.rdbuf();
    return buf.str();
}
```

<br>

### Redirect streams

每个人都知道如何使用命令外壳将程序的输出重定向到日志文件。

```shell
$ echo Hello, world! > hello-world.log
$ cat hello-world.log
Hello, world!
```

流缓冲区允许从程序内部进行更灵活的流重定向，再次使用`rdbuf()`，这次同时获取和设置流的缓冲区。

```c++
#include <ostream>

// Stream redirecter.
class redirecter
{
public:
    // Constructing an instance of this class causes
    // anything written to the source stream to be redirected
    // to the destination stream.
    redirecter(std::ostream & dst, std::ostream & src)
        : src(src)
        , srcbuf(src.rdbuf())
    {
        src.rdbuf(dst.rdbuf());
    }

    // The destructor restores the original source stream buffer
    ~redirecter()
    {
        src.rdbuf(srcbuf);
    }
private:
    std::ostream & src;
    std::streambuf * const srcbuf;
};
```

<br>

### Tee streams

我们有些时候，可能想将一个输出内容，输出到两个地方。

```shell
$ echo Hello, world! | tee hello-world.log
Hello, world!
$ cat hello-world.log 
Hello, world!
```

代码来源：[SimpleNES](https://github.com/amhndu/SimpleNES)

```c++
    //Courtesy of http://wordaligned.org/articles/cpp-streambufs#toctee-streams
    class TeeBuf : public std::streambuf
    {
        public:
            // Construct a streambuf which tees output to both input
            // streambufs.
            TeeBuf(std::streambuf* sb1, std::streambuf* sb2);
        private:
            // This tee buffer has no buffer. So every character "overflows"
            // and can be put directly into the teed buffers.
            virtual int overflow(int c);
            // Sync both teed buffers.
            virtual int sync();
        private:
            std::streambuf* m_sb1;
            std::streambuf* m_sb2;
    };

    class TeeStream : public std::ostream
    {
        public:
            // Construct an ostream which tees output to the supplied
            // ostreams.
            TeeStream(std::ostream& o1, std::ostream& o2);
        private:
            TeeBuf m_tbuf;
    };
```

```c++
    TeeBuf::TeeBuf(std::streambuf * sb1, std::streambuf * sb2) :
        m_sb1(sb1),
        m_sb2(sb2)
    {}
    int TeeBuf::overflow(int c)
    {
        if (c == EOF)
        {
            return !EOF;
        }
        else
        {
            int const r1 = m_sb1->sputc(c);
            int const r2 = m_sb2->sputc(c);
            return r1 == EOF || r2 == EOF ? EOF : c;
        }
    }

    int TeeBuf::sync()
    {
        int const r1 = m_sb1->pubsync();
        int const r2 = m_sb2->pubsync();
        return r1 == 0 && r2 == 0 ? 0 : -1;
    }

    TeeStream::TeeStream(std::ostream& o1, std::ostream& o2) :
        std::ostream(&m_tbuf),
        m_tbuf(o1.rdbuf(), o2.rdbuf())
    {}
```

```c++
    std::ofstream logFile ("simplenes.log"), cpuTraceFile; // 两个输出文件流
    sn::TeeStream logTee (logFile, std::cout); // 构造一个tee：使用logFile输出到文件，使用cout输出到标准输出
```

因为我不知道[std::basic_ostream](https://zh.cppreference.com/w/cpp/io/basic_ostream)和[std::basic_streambuf](https://zh.cppreference.com/w/cpp/io/basic_streambuf)之间的关系，所以我看不懂上面的代码。下面为推测。

* `TeeStream`在`TeeBuf`提供的流上进行高层操作。因为`TeeStream`继承了`ostream`，所以`TeeStream`继承了`ostream`的操作。

* `TeeBuf`继承了`streambuf`。将传入到`TeeBuf`的内容，填充到o1和o2的缓冲区。

这里有个类似的示例参考：[C++ 之定制输入输出流](http://kaiyuan.me/2017/06/22/custom-streambuf/)

这里的内容，暂时没有弄懂。因为弄懂需要去看I/O操作和流之间关系的源码。希望以后遇到包含tee功能的第三方库，避免自己去写。