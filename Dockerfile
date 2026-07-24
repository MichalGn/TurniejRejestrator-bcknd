#URUCHOMIENIE  
#1. W persistence.xml zamienić isstniejący DS na PostgreSQLDS  (java:jboss/datasources/PostgreSQLDS), (dotychczasowy, stary: java:/TurniejRejestratorDS)
#   W pom.xml ma być wildfly-maven-plugin
#   Skompilować (build)

#2.
#sudo docker build -t turniejrejestrator-bcknd_image .

#sudo docker save -o turniejrejestrator-bcknd-260723.tar turniejrejestrator-bcknd_image   //Zapisanie do pliku

#sudo docker load -i turniejrejestrator-bcknd-250726.tar  //rozpakowanie pliku:


#Otworzenie bazy w cmd
#docker exec -it -postgresdb_container psql -U postgres -d bigmagdb

#Przekopiowanie bazy z pliku sql do bazy w dockerze
#1.
#docker cp evocaredb_240729_0000.sql evocare-postgresdb_container:/dump.sql
#2.
#docker exec -it evocare-postgresdb_container bash
#3a.
#(jeżeli plik utworzono: pg_dump -U postgres -O evocaredb > evocaredb_240730_all.sql)
#(docelowa baza ma być utworzona, ale bez tabel!)
#psql -U postgres -d evocaredb -f /dump.sql

#3b
#pg_restore -U postgres -d evocaredb /dump.sql

#----------------------------------------------
FROM quay.io/wildfly/wildfly-runtime:latest

# Copy application
COPY --chown=jboss:root target/server $JBOSS_HOME

# Set permissions
RUN chmod -R ug+rwX $JBOSS_HOME

