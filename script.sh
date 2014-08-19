#!/bin/bash

echo $TRAVIS_PULL_REQUEST
echo $TRAVIS_BRANCH

if [[ $TRAVIS_PULL_REQUEST == "false" && $TRAVIS_BRANCH == "master" ]]; then
    echo "Commit made to master and is not a pull request"
fi