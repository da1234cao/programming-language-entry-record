#ifndef TRAY_H
#define TRAY_H

#include "mainwindow.h"

#include <QDialog>
#include <QSystemTrayIcon>
#include <QMenu>
#include <QAction>
#include <QString>
#include <QMessageBox>
#include <QApplication>
#include <QPushButton>
#include <memory>


class tray : public QDialog
{
    Q_OBJECT

private:
    std::shared_ptr<QSystemTrayIcon> trayIcon; // 菜单图标
    std::shared_ptr<QMenu> trayMenu; // 菜单上下文
    std::shared_ptr<QAction> showAction; // 显示选项
    std::shared_ptr<QAction> versionAction; // 菜单中版本选项
    std::shared_ptr<QAction> quitAction; // 菜单中退出选项

    std::shared_ptr<mainWindow> windowInterface; // 主窗口界面
    bool isShowVersion = false; // 当前正在展示版本界面

private slots:
    void show_version(void);
    void exit(void);

public:
    tray(QWidget *parent = nullptr);
    void createAction(void);
    void createIcon(void);
    ~tray();
};
#endif // TRAY_H
