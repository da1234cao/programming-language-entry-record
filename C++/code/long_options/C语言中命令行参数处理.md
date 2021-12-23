[toc]

## 应用场景

命令行参数有不同的样式。

```shell
# 短选项与长选项
ls -a # 短线后面跟选项，选项没有参数
ls -alh # 不带参数的选项可用连写，不分先后顺序
ls --all # 双短线的长选项，和-a是相同的功能

# 选项后面是否跟参数
ls -a # 不带参数
ls --block-size=SIZE # 带参数
ls --color[=WHEN] # 参数可选，选项和参数之间没有空格
```

[ls](https://github.com/coreutils/coreutils/blob/1435e8e5c51a9d7bb38b7a337058d80a8b78d79a/src/ls.c#L1919)使用[getopt_long()](https://man7.org/linux/man-pages/man3/getopt.3.html)函数实现上面功能。

```c
static struct option const long_options[] =
{
  {"all", no_argument, NULL, 'a'},
  {"escape", no_argument, NULL, 'b'},
  ...
  {"context", no_argument, 0, 'Z'},
  {"author", no_argument, NULL, AUTHOR_OPTION},
  {GETOPT_HELP_OPTION_DECL},
  {GETOPT_VERSION_OPTION_DECL},
  {NULL, 0, NULL, 0}
};

int c = getopt_long (argc, argv,"abcdfghiklmnopqrstuvw:xABCDFGHI:LNQRST:UXZ1",long_options, &oi);
```

可以看到命令行选项有两种样式(两者等价)：`long_options`和`"abcdfghiklmnopqrstuvw:xABCDFGHI:LNQRST:UXZ1"`。

`option`结构体如下：

```c
struct option
{
  const char *name; // 长选项名
  int has_arg; // 选项是否带参数：不带参数，带参数，参数可选
  int *flag;   // 当flag等于NULL，getopt_long返回val
  int val;     // val 可以设置成长选项名的第一个字母
};

```

长选项转换成短选项。

```c
const char *optstring_from_long_options(const struct option *opt){
    // 将长参数转换成短参数
    // "AB:C::"表示：A后面没有参数；B后面有参数；C后面可以有参数，也可以没有，有的话必须紧跟选项
    static char optstring[256] = {0};
    char *osp = optstring;

    for(; opt->name != NULL; opt++){
        if(opt->flag == 0 && opt->val >= 'A' && opt->val <= 'z'){
            *osp++ = opt->val;
            switch (opt->has_arg){
            case optional_argument:
                *osp++ = ':';
                *osp++ = ':';
                break;
            case required_argument:
                *osp++ = ':';
                break;
            default:
                break;
            }
        }
    }

    return optstring;
}
```

## 实践

下面的代码改自[fuzznetlink.c](https://github.com/cloudflare/cloudflare-blog/blob/master/2019-07-kernel-fuzzing/src/fuzznetlink.c)。

需求：打印文字情感logo。

* 一个选项(无参数)，用以确定情感文字类型。
* 一个选项(带参数)，用以确定打印一类情感文字的个数。
* 一个选项(可选参数)，不带参数时随机打印一个情感文字，带参数时打印指定个数的情感文字。

```c
➜  tree        
.
├── comm.h
├── logo.cpp
├── long_options.cpp
└── Makefile

0 directories, 4 files
```

其他代码见仓库。下面为命令行参数处理代码。

```c
#include <getopt.h>
#include <iostream>
#include <vector>
#include <string>

#include "comm.h"

using namespace std;

struct state {
    int smile_nums=0;
    int cry_nums=0;
    int tired_nums=0;
    int nums=0;
    int kinds = 3;
};

static void usage(const char *command){
    // C语言中连续的用""引起的字符串常量，会默认合并为一个常量字符串
    fprintf(stderr,
    "Usage:\n"
    "\n"
    "   %s [option]\n"
    "\n"
    "Options;\n"
    "\n"
    "   -s --smile        Print smile logo\n"
    "   -c --cry          Print cry logo\n"
    "   -t --tired        Print tired logo\n"
    "   -n --nums         nums logos are printed\n"
    "   -r --rand         rand(choice) output logo\n"
    "\n",
    command);
}

const char *optstring_from_long_options(const struct option *opt){
    // 将长参数转换成短参数
    // "AB:C::"表示：A后面没有参数；B后面有参数；C后面可以有参数，也可以没有，有的话必须紧跟选项
    static char optstring[256] = {0};
    char *osp = optstring;

    for(; opt->name != NULL; opt++){
        if(opt->flag == 0 && opt->val >= 'A' && opt->val <= 'z'){
            *osp++ = opt->val;
            switch (opt->has_arg){
            case optional_argument:
                *osp++ = ':';
                *osp++ = ':';
                break;
            case required_argument:
                *osp++ = ':';
                break;
            default:
                break;
            }
        }
    }

    return optstring;
}

int main(int argc, char **argv){
    static struct option long_options[] = {
        {"smile",no_argument,NULL,'s'},
        {"cry",no_argument,NULL,'c'},
        {"tired",no_argument,NULL,'t'},
        {"nums",required_argument,NULL,'n'},
        {"rand",optional_argument,NULL,'r'},
        {NULL,0,0,0}
    };

    const char *optstring = optstring_from_long_options(long_options);

    struct state st;
    int i=0, n=0;

    while(1){
        int option_index = 0;
        int arg = getopt_long(argc,argv,optstring,long_options,&option_index);

        if(arg == -1)
            break;
        
        switch (arg){
        case 0:
            fprintf(stderr,"Unknow option :%s", long_options[option_index].name);
            exit(-1);
            break;
        case 's':
            st.smile_nums = 1;
            break;
        case 'c':
            st.cry_nums = 1;
            break;
        case 't':
            st.tired_nums = 1;
            break;
        case 'n':
            st.nums = atoi(optarg);
            break;
        case 'r':
            // 随机生成optarg个相同的表情
            if(optarg)
                n = atoi(optarg);
            else
                n = 1;
            srand(time(NULL));
            i = rand()%st.kinds;
            if(i == 0)
                st.smile_nums = n;
            else if(i == 1)
                st.cry_nums = n;
            else
                st.tired_nums = n;
            break;
        default:
            fprintf(stderr,"Unknow option :%s", long_options[option_index].name);
            exit(-1);
            break;
        }
    }

    if(st.nums != 0){
        if(st.smile_nums) st.smile_nums = st.nums;
        if(st.cry_nums) st.cry_nums = st.nums;
        if(st.tired_nums) st.tired_nums = st.nums;
    }


    // 根据读取的参数，绘制表情
    for(int i=0; i<st.smile_nums; i++)
        print_logo(smile_str);
    for(int i=0; i<st.cry_nums; i++)
        print_logo(cry_str);
    for(int i=0; i<st.tired_nums; i++)
        print_logo(tired_nums);

    return 0;
}
```

执行结果如下：

```shell
./long_options --tired
  _   _              _ 
 | | (_)            | |
 | |_ _ _ __ ___  __| |
 | __| | '__/ _ \/ _` |
 | |_| | | |  __/ (_| |
  \__|_|_|  \___|\__,_|
                       

./long_options -c -n 2
                  
  / __| '__| | | |
 | (__| |  | |_| |
  \___|_|   \__, |
             __/ |
            |___/ 
                  
                  
  / __| '__| | | |
 | (__| |  | |_| |
  \___|_|   \__, |
             __/ |
            |___/ 


./long_options -r2    
                _ _      
               (_) |     
  ___ _ __ ___  _| | ___ 
 / __| '_ ` _ \| | |/ _ \
 \__ \ | | | | | | |  __/
 |___/_| |_| |_|_|_|\___|
                         
                         
                _ _      
               (_) |     
  ___ _ __ ___  _| | ___ 
 / __| '_ ` _ \| | |/ _ \
 \__ \ | | | | | | |  __/
 |___/_| |_| |_|_|_|\___|


 ./long_options -st
                _ _      
               (_) |     
  ___ _ __ ___  _| | ___ 
 / __| '_ ` _ \| | |/ _ \
 \__ \ | | | | | | |  __/
 |___/_| |_| |_|_|_|\___|
                         
                         
  _   _              _ 
 | | (_)            | |
 | |_ _ _ __ ___  __| |
 | __| | '__/ _ \/ _` |
 | |_| | | |  __/ (_| |
  \__|_|_|  \___|\__,_|
                       
                       
```

## 相关链接

[getopt(3) — Linux manual page](https://man7.org/linux/man-pages/man3/getopt.3.html)

[Linux下getopt_long函数的使用](https://blog.csdn.net/fengbingchun/article/details/81123563)