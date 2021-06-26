cmake_minimum_required (VERSION 2.8.11) # 指定cmake要求的最低版本
project (Transformation) # 指定项目的名称。当使用外部方式进行构建的时候，PROJECT_SOURCE_DIR指向的目录同内部构建相同，PROJECT_BINARY_DIR指向构建目录

find_package(Eigen3 REQUIRED) # 通过/usr/share/cmake/Modules/，找到eigen的库
include_directories(EIGEN3_INCLUDE_DIR) # 指定检索的头文件

add_executable (Transformation main.cpp) # 将main.cpp编译生成可执行文件Transformation
