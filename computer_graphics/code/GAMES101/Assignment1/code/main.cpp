#include "Triangle.hpp"
#include "rasterizer.hpp"
#include <eigen3/Eigen/Eigen>
#include <iostream>
#include <opencv2/opencv.hpp>
#include <cmath>

constexpr double MY_PI = 3.1415926;

Eigen::Matrix4f get_view_matrix(Eigen::Vector3f eye_pos)
{
    Eigen::Matrix4f view = Eigen::Matrix4f::Identity();

    Eigen::Matrix4f translate;
    translate << 1, 0, 0, -eye_pos[0], 0, 1, 0, -eye_pos[1], 0, 0, 1,
        -eye_pos[2], 0, 0, 0, 1;

    // xyz坐标系中的坐标，用view点的坐标表示。相当于仅变动原点，不变动方向
    view = view*translate;

    return view;
}

Eigen::Matrix4f get_model_matrix(float rotation_angle)
{
    Eigen::Matrix4f model = Eigen::Matrix4f::Identity();

    // TODO: Implement this function
    // Create the model matrix for rotating the triangle around the Z axis.
    // Then return it.
    // 绕z轴旋转rotation_angle角度的旋转矩阵的齐次坐标表示
    float theta = rotation_angle/180.0*M_PI;

    model << std::cos(theta),-std::sin(theta),0,0,
             std::sin(theta),std::cos(theta),0,0,
             0,0,1,0,
             0,0,0,1; 

    return model;
}

Eigen::Matrix4f get_projection_matrix(float eye_fov, float aspect_ratio,
                                      float zNear, float zFar)
{
    // 四个参数：
    // 垂直视角，垂直方向上原点与近平面高低两中点组成的张角大小；
    // 宽高比，近平面的宽度与其高度之比
    // (相对于视点的)近远平面
    // Students will implement this function
    
    Eigen::Matrix4f projection = Eigen::Matrix4f::Identity();

    // 需要注意的是，这个台形要包含上面的三角形
    float theta = eye_fov/180.0/2*M_PI;
    float t = zNear * std::tan(theta);
    float b = -t;
    float r = t*aspect_ratio;
    float l = -r;
    float n = zNear;
    float f = zFar;

    Eigen::Matrix4f pers_2_otho = Eigen::Matrix4f::Identity();
    pers_2_otho << n,0,0,0,
                   0,n,0,0,
                   0,0,n+f,-n*f,
                   0,0,1,0;
    
    Eigen::Matrix4f otho_tans = Eigen::Matrix4f::Identity();
    otho_tans << 1,0,0,-(r+l)/2.0,
                 0,1,0,-(t+b)/2.0,
                 0,0,1,-(n+f)/2.0,
                 0,0,0,1;

    Eigen::Matrix4f otho_scale = Eigen::Matrix4f::Identity();
    otho_scale << 2/(r-l),0,0,0,
                  0,2/(t-b),0,0,
                  0,0,2/(n-f),0,
                  0,0,0,1;
    
    projection = otho_scale*otho_tans*pers_2_otho;
    // TODO: Implement this function
    // Create the projection matrix for the given parameters.
    // Then return it.

    return projection;
}

int main(int argc, const char** argv)
{
    float angle = 0;
    bool command_line = false;
    std::string filename = "output.png";

    if (argc >= 3) {
        command_line = true;
        angle = std::stof(argv[2]); // -r by default
        if (argc == 4) {
            filename = std::string(argv[3]);
        }
        else
            return 0;
    }

    rst::rasterizer r(700, 700);

    Eigen::Vector3f eye_pos = {0, 0, 5};

    std::vector<Eigen::Vector3f> pos{{2, 0, -2}, {0, 2, -2}, {-2, 0, -2}};

    std::vector<Eigen::Vector3i> ind{{0, 1, 2}};

    auto pos_id = r.load_positions(pos);
    auto ind_id = r.load_indices(ind);

    int key = 0;
    int frame_count = 0;

    if (command_line) {
        r.clear(rst::Buffers::Color | rst::Buffers::Depth);

        r.set_model(get_model_matrix(angle));
        r.set_view(get_view_matrix(eye_pos));
        r.set_projection(get_projection_matrix(45, 1, 0.1, 50));

        r.draw(pos_id, ind_id, rst::Primitive::Triangle);
        cv::Mat image(700, 700, CV_32FC3, r.frame_buffer().data());
        image.convertTo(image, CV_8UC3, 1.0f);

        cv::imwrite(filename, image);

        return 0;
    }

    while (key != 27) {
        r.clear(rst::Buffers::Color | rst::Buffers::Depth);

        r.set_model(get_model_matrix(angle));
        r.set_view(get_view_matrix(eye_pos));
        // 这里
        r.set_projection(get_projection_matrix(45, 1, 0.1, 50));

        r.draw(pos_id, ind_id, rst::Primitive::Triangle);

        cv::Mat image(700, 700, CV_32FC3, r.frame_buffer().data());
        image.convertTo(image, CV_8UC3, 1.0f);
        cv::imshow("image", image);
        key = cv::waitKey(10);

        std::cout << "frame count: " << frame_count++ << '\n';

        if (key == 'a') {
            angle += 10;
        }
        else if (key == 'd') {
            angle -= 10;
        }
    }

    return 0;
}
