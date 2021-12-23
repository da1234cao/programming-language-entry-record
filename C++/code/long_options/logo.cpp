#include <vector>
#include <string>
#include <iostream>

#include "comm.h"

const std::vector<std::string> smile_str = {
    "                _ _      ",
    "               (_) |     ",
    "  ___ _ __ ___  _| | ___ ",
    " / __| '_ ` _ \\| | |/ _ \\",
    " \\__ \\ | | | | | | |  __/",
    " |___/_| |_| |_|_|_|\\___|",
    "                         ",
    "                         "
};

const std::vector<std::string> cry_str = {
    "                  ",
    "  / __| '__| | | |",
    " | (__| |  | |_| |",
    "  \\___|_|   \\__, |",
    "             __/ |",
    "            |___/ ",
    "                  "
};

const std::vector<std::string> tired_nums = {
    "  _   _              _ ",
    " | | (_)            | |",
    " | |_ _ _ __ ___  __| |",
    " | __| | '__/ _ \\/ _` |",
    " | |_| | | |  __/ (_| |",
    "  \\__|_|_|  \\___|\\__,_|",
    "                       ",
    "                       "
};

void print_logo(const std::vector<std::string> &logo){
    int n = logo.size();
    for(int i=0; i<n; i++)
        std::cout<<logo[i]<<std::endl;
}
