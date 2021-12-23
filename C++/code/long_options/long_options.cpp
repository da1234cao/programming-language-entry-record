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