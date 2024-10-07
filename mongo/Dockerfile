FROM mongo:7

WORKDIR /data/configdb

RUN openssl rand -base64 756 > /data/configdb/mongo-keyfile \
    && chmod 400 /data/configdb/mongo-keyfile

WORKDIR /usr/src/config

COPY mongo-init.sh /docker-entrypoint-initdb.d/

RUN chmod +x /docker-entrypoint-initdb.d/mongo-init.sh