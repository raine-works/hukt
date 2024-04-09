FROM oven/bun:1.1.3-debian AS base
WORKDIR /workspaces

ARG USERNAME
ENV SHELL="/bin/bash"

RUN apt-get update 
RUN apt-get upgrade -y 
RUN apt-get install -y sudo zip gzip tar iputils-ping dnsutils net-tools nano

RUN groupmod --new-name ${USERNAME} bun
RUN usermod -l ${USERNAME} -d /home/${USERNAME} -m bun
RUN echo ${USERNAME} ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/${USERNAME}

USER ${USERNAME}