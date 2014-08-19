#!/bin/bash

BRANCH=`git rev-parse --abbrev-ref HEAD`

echo $BRANCH
echo $TRAVIS_REPO_SLUG
