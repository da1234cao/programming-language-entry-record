# Jupyter notebook里面的语法高亮模块
# 难道python终端没有语法高亮？

# 参考:
# [ipython](https://ipython.org/)
# [pygments](https://pygments.org/docs/)

# [How can I check if code is executed in the IPython notebook?]
# (https://stackoverflow.com/questions/15411967/how-can-i-check-if-code-is-executed-in-the-ipython-notebook/54967911#54967911)

from IPython import get_ipython

def __isnotebook():
    try:
        shell = get_ipython().__class__.__name__
        if shell == 'ZMQInteractiveShell':
            return True   # Jupyter notebook or qtconsole
        elif shell == 'TerminalInteractiveShell':
            return False  # Terminal running IPython
        else:
            return False  # Other type (?)
    except NameError:
        return False      # Probably standard Python interpreter


# check for rich output
def __rich_output():
    __rich_output = __isnotebook()
    return __rich_output

# print file with syntax highlighing
def print_file(filename,lexer=None):
    content = open(filename,"rb").read().decode('utf-8')
    print_content(content,filename,lexer)

def print_content(content,filename=None,lexer=None):
    from pygments import highlight,lexers,formatters,styles
    if __rich_output():
        if lexer is None:
            if filename is None:
                lexer = lexers.guess_lexer(content)
            else:
                lexer = lexers.get_lexer_for_filename(filename)
        # colorful_content = highlight(content,lexer,formatters.TerminalFormatter(bg="dark",linenos=True))
        colorful_content = highlight(content,lexer,formatters.TerminalFormatter())
        print(colorful_content,end="")
    else:
        print(content,end="")
