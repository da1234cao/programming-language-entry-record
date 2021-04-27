[toc]

## 前言

来源1：《机器学习》-- 周志华，3.2节线性回归。

来源2：[李宏毅机器学习作业一](https://colab.research.google.com/drive/131sSqmrmWXfjFZ3jWSELl8cm0Ox5ah3C)

注释：我又菜又狗，固不涉及数学证明。

<br>

## 理论介绍

$$
\begin{aligned}&\text { 给定数据集D=\{ } \left.\left(\mathbf{x}_{1}, \quad \mathrm{y}_{1}\right), \quad\left(\mathbf{x}_{2}, \quad \mathrm{y}_{2}\right), \ldots, \quad\left(\mathbf{x}_{\mathrm{m}}, \quad \mathrm{y}_{\mathrm{m}}\right)\right\}, \text { 其中 }\mathbf{x}_{\mathrm{i}}=\left(\mathrm{x}_{\mathrm{i} 1} ; \mathrm{x}_{\mathrm{i} 2} ; \ldots ; \mathrm{x}_{\mathrm{id}} ; \quad\right) \mathrm{y}_{\mathrm{i}} \in \mathbb{R} \text { 。“线性回归” (linear regression) 试图学}\text {得一个线性模型以尽可能准确地预测实值输出标记。 }\end{aligned}
$$

**线性回归试图学得**：$\mathrm{f}\left(\mathrm{x}_{\mathrm{i}}\right)=\mathrm{wx}_{\mathrm{i}}+\mathrm{b}, \text { 使得f }\left(\mathrm{x}_{\mathrm{i}}\right) \simeq \mathrm{y}_{\mathrm{i}}$

**如何确定w和b呢**？关键在于如何衡量发f(x)与y之间的差别。均方误差是回归任务中最常用的性能度量， 因此我们可试图让均方误差最小化。基于均方误差最小化来进行模型求解的方法称为“最小二乘法”（least square method） 。 在线性回归中， 最小二乘法就是试图找到一条直线， 使所有样本到直线上的欧氏距离之和最小。

**我们这里将均方误差的表达式称为损失函数**。
$$
\begin{aligned}\left(w^{*}, b^{*}\right) &=\underset{(w, b)}{\arg \min } \sum_{i=1}^{m}\left(f\left(x_{i}\right)-y_{i}\right)^{2} \\&=\underset{(w, b)}{\arg \min } \sum_{i=1}^{m}\left(y_{i}-w x_{i}-b\right)^{2}\end{aligned}
$$

$$
\begin{aligned}&\frac{\partial E_{(w, b)}}{\partial w}=2\left(w \sum_{i=1}^{m} x_{i}^{2}-\sum_{i=1}^{m}\left(y_{i}-b\right) x_{i}\right)\\&\frac{\partial E_{(w, b)}}{\partial b}=2\left(m b-\sum_{i=1}^{m}\left(y_{i}-w x_{i}\right)\right)\end{aligned}
$$

其实，把$x_0$设为1，参数b可以合并到w中。
$$
\frac{\partial E_{\hat{w}}}{\partial \hat{\boldsymbol{w}}}=2 \mathbf{X}^{\mathrm{T}}(\mathbf{X} \hat{\boldsymbol{w}}-\boldsymbol{y})
$$


因为损失函数是凸函数。所以令上面两个偏微分为零，损失函数最小，得到的w和b即为我们需要的解。

**不知道为什么没有使用数学的方法，作业中采用梯度下降的方式求解w和b**。

**即，从原点(w=0,b=0)出发，计算出在原点，两个偏微分的值。我们将这个值称为梯度。顺着梯度方向，不断更新w和b的值，直到找到损失函数的最小值**。

w和L(w)构成的应该是个多维图形。为了简单绘制理解起见，下面画出二维图形。

<img src="./Linear_Regression.assets/Gradient_Descent.png" alt="Gradient_Descent" style="zoom: 80%;" />

<br>

## 代码

课程给出的作业是，根据连续的9个小时的空气数据，推测接下来一个小时的PM2.5数值。

我们根据目的，设置我们模型的输入&参数、输出。

这道题目，可以将连续9个小时的空气数据作为一个输入。即矩阵每一行表示一个输入元素，行数表示样本个数。

此时，输入和输出的矩阵格式已知，可以推出参数的矩阵行数和列数。
$$
f(x)=w_{1} x_{1}+w_{2} x_{2}+\ldots+w_{d} x_{d}+b
$$
连续9个小时的空气数据是个二维数据，为了满足上面这样的线性模型，作业中通过reshape将二维数据转换成一维数据。

<font color=red>不知道，可以不可以，在线性模型中，输入是二维数据，参数w也是二维数组</font> 。（回头老师上课上到这里，我问下）

```python
dim = 18 * 9 + 1
w = np.zeros([dim, 1])
x = np.concatenate((np.ones([12 * 471, 1]), x), axis = 1).astype(float)
learning_rate = 100
iter_time = 1000
adagrad = np.zeros([dim, 1])
eps = 0.0000000001
for t in range(iter_time):
    loss = np.sqrt(np.sum(np.power(np.dot(x, w) - y, 2))/471/12)#rmse
    if(t%100==0):
        print(str(t) + ":" + str(loss))
    gradient = 2 * np.dot(x.transpose(), np.dot(x, w) - y) #dim*1
    adagrad += gradient ** 2
    w = w - learning_rate * gradient / np.sqrt(adagrad + eps)
np.save('weight.npy', w)
w
```

核心代码是：

```python
# 损失函数(均方误差)
loss = np.sqrt(np.sum(np.power(np.dot(x, w) - y, 2))/471/12)#rmse

# w处的梯度求解
 gradient = 2 * np.dot(x.transpose(), np.dot(x, w) - y) 

# 梯度(迭代)下降
# learning rate暂时可以不管（Adagrad）
w = w - learning_rate * gradient / np.sqrt(adagrad + eps)
```

找出合适w和b之后，便可以通过给定的数据，进行PM2.5的预测。

**但是，此时有个问题，这个模型是否合适？如何判断？判断之后，如何优化**。-- （模型的评估与选择）暂时跳过。

