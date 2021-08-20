[toc]



## 字符串

1. 修剪字符串两边的空格

   ```c++
   // trim from start (construct new string)
   inline std::string ltrim(const std::string &str){
   	std::string s(str);
   	s.erase(s.begin(), std::find_if_not<decltype(s.begin()), int(int)>(s.begin(), s.end(),
       	std::isspace));
       return s;
       }
   
   // trim from end (construct new string)
   inline std::string rtrim(const std::string &str){
   	std::string s(str);
   	s.erase(std::find_if_not<decltype(s.rbegin()), int(int)>(s.rbegin(), s.rend(),
       	std::isspace).base(), s.end());
   	return s;
   }
   ```

   