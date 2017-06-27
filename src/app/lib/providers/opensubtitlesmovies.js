(function(App) {
    'use strict';

    var _ = require('underscore');
    var request = require('request');
    var Q = require('q');
    var OpenSubtitlesApi = require('opensubtitles-api');
    var OS = new OpenSubtitlesApi('Popcorn Time v1');

    var baseUrl = 'http://api.yifysubtitles.com/subs/';
    var mirrorUrl = 'http://api.ysubs.com/subs/';
    var prefix = 'http://www.yifysubtitles.com';

    var TTL = 1000 * 60 * 60 * 4; // 4 hours

    var OpenSubtitlesMovies = function() {
        App.Providers.CacheProvider.call(this, 'subtitle', TTL);
    };

    OpenSubtitlesMovies.prototype = Object.create(App.Providers.CacheProvider.prototype);
    OpenSubtitlesMovies.prototype.constructor = OpenSubtitlesMovies;

    // Language mapping to match PT langcodes
    var languageMapping = {
        'albanian': 'sq',
        'arabic': 'ar',
        'bengali': 'bn',
        'brazilian-portuguese': 'pt-br',
        'bulgarian': 'bg',
        'bosnian': 'bs',
        'chinese': 'zh',
        'croatian': 'hr',
        'czech': 'cs',
        'danish': 'da',
        'dutch': 'nl',
        'english': 'en',
        'estonian': 'et',
        'farsi-persian': 'fa',
        'finnish': 'fi',
        'french': 'fr',
        'german': 'de',
        'greek': 'el',
        'hebrew': 'he',
        'hungarian': 'hu',
        'indonesian': 'id',
        'italian': 'it',
        'japanese': 'ja',
        'korean': 'ko',
        'lithuanian': 'lt',
        'macedonian': 'mk',
        'malay': 'ms',
        'norwegian': 'no',
        'polish': 'pl',
        'portuguese': 'pt',
        'romanian': 'ro',
        'russian': 'ru',
        'serbian': 'sr',
        'slovenian': 'sl',
        'spanish': 'es',
        'swedish': 'sv',
        'thai': 'th',
        'turkish': 'tr',
        'urdu': 'ur',
        'ukrainian': 'uk',
        'vietnamese': 'vi'
    };

    var querySubtitles = function(imdbIds) {
        win.debug(imdbIds);

        if (_.isEmpty(imdbIds)) {
            return {};
        }

        /*
        var url = baseUrl + _.map(imdbIds.sort(), function(id) {
            return id;
        }).join('-');

        var mirrorurl = mirrorUrl + _.map(imdbIds.sort(), function(id) {
            return id;
        }).join('-');
        */

        var deferred = Q.defer();

        var subtitlesList = {};
        subtitlesList.subs = {};

        /*
        return s = (function() {
            _.each(imdbIds, function(id) {
                win.debug("id: " + id);
                //subtitlesList.subs[id] = {};
                subtitlesList.subs[id] = Q.all(OS.search({
                    imdbid: id,
                    gzip: false
                }).then(subtitles => {
                    if (subtitles) {
                        win.debug('Subtitle found:', subtitles);
                        //return subtitlesList;
                        return subtitles;
                    }
                }));
                win.debug("SubtitleList found: " + subtitlesList.subs[id]);
            });
            win.debug('SubtitleList Subs found:', subtitlesList.subs);
            return Q.all(subtitlesList.subs);
        })();
        */

        //Cycle through each imdbId then return the sublist


        //Search for imdbId
        return Q.all(
            _.map(imdbIds, function(id) {
                var deferred = Q.defer();

                OS.search({
                    imdbid: id,
                    gzip: false
                }).then(subtitles => {
                    if (subtitles) {
                        win.debug('Subtitle found:', subtitles);
                        //win.debug('SubtitleList found:', subtitlesList); 
                        //win.debug("SubtitlesList[0]" + subtitlesList);
                        //subtitlesList.subs[id] = subtitles;
                        win.debug("Returning Subtitles: " + JSON.stringify({
                            [id]: subtitles
                        }));
                        deferred.resolve({
                            [id]: subtitles
                        });
                    } else {
                        //subtitles is blank
                        deferred.resolve({});
                    }

                });
                return deferred.promise; //.then(formatForPopcorn);
            })).then(data => {

            //Create subtitleList Array and return based on the input list
            win.debug("SubtitlesList: " + JSON.stringify(data));
            var subtitleList = {};
            subtitleList.subs = {};

            _.each(data, function(item) {
                for (var name in item) {
                    win.debug("Subtitle IMDB ID: " + name);
                    subtitleList.subs[name] = item[name];
                    //win.debug("SubtitlesList: " + JSON.stringify(subtitleList.subs));
                }
                //win.debug("SubtitleList at index " + JSON.stringify(subtitleList.subs));
            });
            return subtitleList;
        });
    };



    /*
    request({
        url: url,
        json: true
    }, function(error, response, data) {
        if (error || response.statusCode >= 400 || !data || !data.success) {
            request({
                url: mirrorurl,
                json: true
            }, function(error, response, data) {
                if (error || response.statusCode >= 400 || !data || !data.success) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(data);
                }
            });
        } else {
            deferred.resolve(data);
        }
    });
    */

    var formatForPopcorn = function(data) {
        //win.debug("formatForPopcorn:data: " + JSON.stringify(data));

        var allSubs = {};
        // Iterate each movie
        _.each(data.subs, function(langs, imdbId) {
            //win.debug("formatForPopcorn:each:langs " + JSON.stringify(langs));
            //win.debug("formatForPopcorn:each:imdbId " + JSON.stringify(imdbId));
            var movieSubs = {};
            // Iterate each language
            _.each(langs, function(subs, lang) {
                //win.debug("formatForPopcorn:each:subs " + JSON.stringify(subs));
                //win.debug("formatForPopcorn:each:lang " + JSON.stringify(lang));
                // Pick highest rated
                var langCode = lang; //languageMapping[String.toString(subs.lang).toLowerCase()];
                var ratedSub = _.max({
                    subs
                }, function(s) {
                    return s.score;
                });

                movieSubs[langCode] = ratedSub.url;
            });

            // Remove unsupported subtitles
            var filteredSubtitle = App.Localization.filterSubtitle(movieSubs);

            allSubs[imdbId] = filteredSubtitle;
        });

        win.debug("Common.santize: " + JSON.stringify(Common.sanitize(allSubs)));

        return Common.sanitize(allSubs);
        //return allSubs;
    };

    OpenSubtitlesMovies.prototype.query = function(ids) {
        return querySubtitles(ids).then(formatForPopcorn);
    };

    App.Providers.OpenSubtitlesMovies = OpenSubtitlesMovies;

    /*
        //Sample Code
        const OpenSubtitles = require('opensubtitles-api');
        const OS = new OpenSubtitles('OSTestUserAgent');
        OS.search({
            imdbid: 'tt0314979',
            sublanguageid: 'fre',
            gzip: true
        }).then(subtitles => {
            if (subtitles.fr) {
                console.log('Subtitle found:', subtitles);
                require('request')({
                    url: subtitles.fr.url,
                    encoding: null
                }, (error, response, data) => {
                    if (error) throw error;
                    require('zlib').unzip(data, (error, buffer) => {
                        if (error) throw error;
                        const subtitle_content = buffer.toString(subtitles.fr.encoding);
                        console.log('Subtitle content:', subtitle_content);
                    });
                });
            } else {
                throw 'no subtitle found';
            }
        }).catch(console.error);
    */
})(window.App);