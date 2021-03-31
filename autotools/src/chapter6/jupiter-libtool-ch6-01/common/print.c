#include "jupcommon.h"

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

static void* print_it(void* data){
    printf("Hello from %s!\n",(const char *)data);
    return 0;
}

int print_routine(const char * name){
    pthread_t tid;
    pthread_create(&tid, 0, print_it, (void*)name);
    pthread_join(tid, 0);
    return 0;
}