#ifndef COMM_H
#define COMM_H

#include <vector>
#include <string>
#include <iostream>

// logo相关的变量声明和函数
extern const std::vector<std::string> smile_str;
extern const std::vector<std::string> cry_str;
extern const std::vector<std::string> tired_nums;
void print_logo(const std::vector<std::string> &logo);


#endif