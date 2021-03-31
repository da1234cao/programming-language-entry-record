#ifndef MODULE_H
#define MODULE_H

/**
 * 1. 需要导入的函数名
 * 2. 定义了一个函数指针get_salutaion_t类型。这个函数指针类型，不需要参数，返回const char*类型
 * 3. 申明该函数
*/
#define GET_SALUTATION_SYM "get_salutation"
typedef const char * get_salutation_t(void);
const char * get_salutation(void);

#endif