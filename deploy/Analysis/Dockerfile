# LTS Ubuntu version
FROM ubuntu:22.04

# preconfigure enironment variables for the container
ENV DEBIAN_FRONTEND noninteractive
ENV LANG="C.UTF-8"
ENV LC_ALL="C.UTF-8"
ENV PYTHON=/usr/bin/python3

# install necessary software
RUN apt-get update && apt-get install -y \
    ca-certificates \
    wget \
    git \
    jq \
    python3 \
    python3-pip \
    python3-pygments \
    make \
    texlive-base \
    texlive-bibtex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-extra \
    texlive-publishers \
    texlive-science

# create folders
RUN mkdir -p /analysis /tools


# clone and rename the report repository
WORKDIR /
RUN git clone https://github.com/ilnazTayebi/Master_Thesis_smoke.git

RUN mv /Master_Thesis_smoke /report

# switch folder
WORKDIR /analysis


# copy the analysis, scripts, requirements and make files into the container
COPY ../../analysis/analysis.py /analysis
COPY ../../analysis/analysis-query-plan.py /analysis
COPY ../../deploy/Analysis/doall.sh /analysis
COPY ../../deploy/Analysis/requirements.txt /analysis
COPY ../../deploy/Analysis/Makefile /report

# make scripts executable
RUN chmod +x doall.sh

# install experiment requirements
RUN pip3 install -r requirements.txt
