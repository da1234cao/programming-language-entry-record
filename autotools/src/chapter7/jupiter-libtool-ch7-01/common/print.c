#include "jupcommon.h"

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

static void* print_it(void* data){
    const char** string = (const char**)data;
    printf("%s Hello from %s!\n",string[0],string[1]);
    return 0;
}

int print_routine(const char* salutation, const char * name){
    const char* string[] = {salutation,name};
    pthread_t tid;
    pthread_create(&tid, 0, print_it, string);
    pthread_join(tid, 0);
    return 0;
}