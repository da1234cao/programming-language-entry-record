#include "tray.h"

tray::tray(QWidget *parent)
    : QDialog(parent)
{
    QApplication::setQuitOnLastWindowClosed(false); // 程序别因为没有窗口显示而隐式退出，点击托盘中的退出选项才给退出

    // 避免connect的时候连接不到这个对象，先把第一层所有的对象创建出来
    windowInterface.reset(new mainWindow(this));

    createAction();
    createIcon();

    setVisible(false); // 由于继承了QDialog，如果没有这行，运行会弹出一个对话框

    trayIcon->show(); // 显示托盘图标
    windowInterface->show();
}


void tray::createAction()
{
    showAction.reset(new QAction(QString("显示界面"), this));
    connect(showAction.get(), &QAction::triggered, windowInterface.get(), &mainWindow::show);

    versionAction.reset(new QAction(QString("版本"), this));
    connect(versionAction.get(), &QAction::triggered, this, &tray::show_version);

    quitAction.reset(new QAction(QString("退出"),this));
    connect(quitAction.get(), &QAction::triggered, this, &tray::exit);
}


void tray::createIcon()
{
    trayMenu.reset(new QMenu(this));
    trayMenu->addAction(showAction.get());
    trayMenu->addAction(versionAction.get());
    trayMenu->addAction(quitAction.get());
    trayIcon.reset(new QSystemTrayIcon(this));

    trayIcon.reset(new QSystemTrayIcon(this));
    trayIcon->setIcon(QIcon(":/image/flow.ico"));
    trayIcon->setContextMenu(trayMenu.get());
}


void tray::show_version()
{
    if(isShowVersion) {
        return;
    }

    isShowVersion = true;
    QMessageBox versionInterface = QMessageBox(this);
    versionInterface.setText("Tray's version is 0.0.0");

    // 如果只有一个按钮，关闭和escap key也会默认使用这个按钮。所以我们再添加一个不显示的no按钮
    versionInterface.setStandardButtons(QMessageBox::Ok);
    versionInterface.button(QMessageBox::Ok)->setText("Qt版本");
    versionInterface.addButton(QMessageBox::No)->hide();

    int ret = versionInterface.exec(); // 使用模态对话框
    if(ret == QMessageBox::Ok) {
        QApplication::aboutQt();
    }
    isShowVersion = false;
}


void tray::exit()
{
    trayIcon->hide(); // QSystemTrayIcon没有close函数，调用hide
    QApplication::quit(); // 退出程序
}


tray::~tray()
{
}

