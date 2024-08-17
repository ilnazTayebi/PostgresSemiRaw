
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND noninteractive
ENV LANG="C.UTF-8"
ENV LC_ALL="C.UTF-8"
ENV PYTHON=/usr/bin/python2.7

RUN apt update && apt install -y \
    ca-certificates \
    git \
    curl \
    jq \
    nano \
    python2.7 \
    r-cran-ggplot2 \
    r-cran-reshape2 \
    r-cran-knitr \
    texlive-base \
    texlive-bibtex-extra \
    texlive-fonts-recommended \
    texlive-latex-extra \
    texlive-publishers 



# Prepare directory structure
## git-repos/       - for external git repositories
## build/           - temporary directory for out-of-tree builds
## bin/             - for generated binary executables
RUN mkdir -p $HOME/build $HOME/bin 
RUN mkdir /usr/bin/reproresults


# WORKDIR /home/repro
# COPY scripts/prepare_data.py .


# make reports and result genarator script files executable
WORKDIR /usr/bin

COPY scripts/doallsteps.sh .
RUN chmod +x doallsteps.sh

# COPY scripts/docheckinsschema.sh .
# RUN chmod +x docheckinsschema.sh

# COPY scripts/dotweetsschema.sh .
# RUN chmod +x dotweetsschema.sh

# COPY scripts/dovenuesschema.sh .
# RUN chmod +x dovenuesschema.sh

# COPY scripts/prepare_data.sh .
# RUN chmod +x prepare_data.sh


WORKDIR /home/repro/git-repos/PostgresSemiRaw/
COPY scripts/start_script.sh .
RUN chmod +x start_script.sh
CMD ["/bin/bash", "start_script.sh"]
EXPOSE 3000/tcp