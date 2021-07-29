#include <iostream>
#include <vector>
#include <memory>
#include <functional>
#include <algorithm>

using namespace std;

int main(void){
    int tmp[] = {1,2,3,4,5,6};
    vector<int,allocator<int>> vec(tmp,tmp+sizeof(tmp)/sizeof(tmp[0]));
    
    cout<<count_if(vec.begin(),vec.end(),not1(bind2nd(less<int>(),2)))<<endl;
    return 0;
}