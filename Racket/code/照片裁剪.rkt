#lang racket

; 代码参考：https://tyrchen.github.io/racket-book/practical-racket.html#%28part._practical-crop%29

(require 2htdp/image racket/cmdline
         (only-in racket/draw read-bitmap))

;读取图片
(define (imageBit image_filename)
  (read-bitmap image_filename))

;创建字体logo
; str = "Hello,Racket\nhttps://blog.csdn.net/sinat_38816924"
(define (textLogo str)
  (text str 100 "orange"))

;将文字logo添加到图片右下角
(define (imageToBox text_logo image)
  (overlay/align "right" "bottom" text_logo image))

; 新图片重命名
(define (normalizeName image_filename log_str)
  "logo.png")

; 命令行启动程序
(command-line
 #:args (image_filename log_str)
 (let* ([image (imageBit image_filename)]
        [text_log (textLogo log_str)]
        [new_image (imageToBox text_log image)])
  (save-image new_image
             (normalizeName image_filename log_str))))