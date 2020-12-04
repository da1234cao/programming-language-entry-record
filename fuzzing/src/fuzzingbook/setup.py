#!/usr/bin/env python3

import setuptools

with open("README.md", "rb") as fh:
    long_description = fh.read().decode('utf-8')

# See https://packaging.python.org/tutorials/packaging-projects/ for details
setuptools.setup(
    name="fuzzingbook",
    version="0.0.1",
    author="dacao",
    author_email="17355051286@163.com",
    description="Code for 'Generating Software Tests' (https://www.fuzzingbook.org/)",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://www.fuzzingbook.org/",
    # packages=['fuzzingbook', 'fuzzingbook.fuzzingbook_utils'],
    packages=setuptools.find_packages(),

    # See https://pypi.org/classifiers/
    # 不上传，自己敲
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Framework :: Jupyter",
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)