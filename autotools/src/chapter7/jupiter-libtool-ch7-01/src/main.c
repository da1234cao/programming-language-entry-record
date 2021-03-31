#include <libjupiter.h>
#include "module.h"
#include <dlfcn.h>
#include <stdio.h>

#define DEFAULT_SALUTATION "Hello"

int main(int argc,char* argv[]){
    const char * salutation = DEFAULT_SALUTATION;

    void *module;
    get_salutation_t * get_salutation_fp = NULL;
    // 需要：ln -s modules/hithere/.libs/hithere.so module.so
    module = dlopen("./module.so", RTLD_NOW);
    if(module !=0 ){
        get_salutation_fp = (get_salutation_t *)dlsym(module,GET_SALUTATION_SYM);
        if(get_salutation_fp != 0)
            salutation = get_salutation_fp();
    }

    jupiter_print(salutation,argv[0]);

    if(module!=0)
        dlclose(module);

    return 0;
}