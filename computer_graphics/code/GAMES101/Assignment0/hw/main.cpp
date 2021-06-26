# include <cmath>
# include <iostream>
# include <eigen3/Eigen/Core> // Matrix和Array类，基本的线性代数，数组操作
# include <eigen3/Eigen/Dense> // ？ Eigen中一个基础头文件


int main(void){
    // float Pi = std::acos(-1);
    double quarter_Pi = (45.0/180.0)*M_PI;

    Eigen::Vector3d P(2.0f,1.0f,1.0f); // (2,1)点的齐次坐标
    
    Eigen::Matrix3d Rotation; // 旋转矩阵的齐次坐标表示(旋转45度)
    Rotation << std::cos(quarter_Pi), -std::sin(quarter_Pi),0,
                std::sin(quarter_Pi), std::cos(quarter_Pi),0,
                0,0,1;

    Eigen::Matrix3d Translation; // 平移矩阵
    Translation << 1,0,1,
                   0,1,2,
                   0,0,1;
    Eigen::Vector3d ans = Translation*Rotation*P;

    std::cout << "Rotation Pi/4,then move (1,2):\n"<< ans <<std::endl;
}

