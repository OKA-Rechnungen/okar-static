# Oberkammeramtsrechnungsbücher



* data is fetched from https://github.com/oka-rechnungen/okar-data
* build with [DSE-Static-Cookiecutter](https://github.com/acdh-oeaw/dse-static-cookiecutter)


## initial (one time) setup

* run `.build_app/scripts/dl_saxon.sh`
* run `.build_app/scripts/fetch_data.sh`
* run `ant -f build_app/xslt/build.xsl`

## start dev server

* `cd html/`
* `python -m http.server`
* go to [http://0.0.0.0:8000/](http://0.0.0.0:8000/)

## publish as GitHub Page

* go to https://https://github.com/oka-rechnungen/okar-static/actions/workflows/build.yml
* click the `Run workflow` button


## dockerize your application

* To build the image run: `docker build -t okar-static .`
* To run the container: `docker run -p 80:80 --rm --name okar-static okar-static`
* in case you want to password protect you server, create a `.htpasswd` file (e.g. https://htpasswdgenerator.de/) and modifiy `Dockerfile` to your needs; e.g. run `htpasswd -b -c .htpasswd admin mypassword`

### run image from GitHub Container Registry

`docker run -p 80:80 --rm --name okar-static ghcr.io/oka-rechnungen/okar-static:main`
