(function(App) {
    'use strict';

    var _ = require('underscore');
    var request = require('request');
    var Q = require('q');
    var OpenSubtitlesApi = require('opensubtitles-api');
    var OS = new OpenSubtitlesApi('Popcorn Time v1');

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

        var deferred = Q.defer();

        //var subtitlesList = {};
        //subtitlesList.subs = {};

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
                        //win.debug("Returning Subtitles: " + JSON.stringify({[id]: subtitles}));
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
            var subtitleList = {};
            subtitleList.subs = {};

            _.each(data, function(item) {
                for (var name in item) {
                    win.debug("Subtitle IMDB ID: " + name);
                    subtitleList.subs[name] = item[name];
                }
            });
            return subtitleList;
        });
    };

    var formatForPopcorn = function(data) {
        //win.debug("formatForPopcorn:data: " + JSON.stringify(data));

        var allSubs = {};
        // Iterate each movie
        _.each(data.subs, function(langs, imdbId) {
            var movieSubs = {};
            // Iterate each language
            _.each(langs, function(subs, lang) {
                // Pick highest rated
                var langCode = lang;
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

        //win.debug("Common.santize: " + JSON.stringify(Common.sanitize(allSubs)));

        return Common.sanitize(allSubs);
    };

    OpenSubtitlesMovies.prototype.query = function(ids) {
        return querySubtitles(ids).then(formatForPopcorn);
    };

    App.Providers.OpenSubtitlesMovies = OpenSubtitlesMovies;

})(window.App);