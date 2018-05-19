app.controller('DashboardController',
    function ($scope, $routeParams, $interval, $http, $location, $mdSidenav, $mdDialog, Servers, Monitor, Alerts, Master, Proxies, Slaves, Cluster, AppService) {
        //Selected cluster is choose from the drop-down-list
        $scope.selectedClusterName = undefined;
        $scope.menuOpened = false;

        $scope.monitors = [
    { id: 'mariadb', name: 'MariaDB' },
    { id: 'mysql', name: 'MySQL' },
    { id: 'percona', name: 'Percona' },
    { id: 'proxysql', name: 'ProxySQL' },
    { id: 'haproxy', name: 'HaProxy' },
    { id: 'shardproxy', name: 'ShardProxy' },
    { id: 'sphinx', name: 'SphinxProxy' },
    { id: 'extvip', name: 'VIP' },

   ];
  $scope.selectedMonitor = { id: 1, name: 'Bob' };

        var getClusterUrl = function () {
            return AppService.getClusterUrl($scope.selectedClusterName);
        };

        $scope.isLoggedIn = AppService.hasAuthHeaders();
        if (!$scope.isLoggedIn) {
            $location.path('login');
        }

        $scope.logout = function () {
            AppService.logout();
            $location.path('login');
        };

        var timeFrame = $routeParams.timeFrame;
        if (timeFrame == "") {
            timeFrame = "10m";
        }

        var callServices = function () {
            if (!AppService.hasAuthHeaders()) return;
                  if ($scope.menuOpened) return;

            Monitor.query({}, function (data) {
                if (data) {

                        $scope.settings = data;
                        if (($scope.settings.clusters !== undefined) && ($scope.selectedClusterName== undefined)) {
                            if ($scope.settings.clusters.length === 1) {
                                $scope.selectedClusterName = $scope.settings.clusters[0];
                            } else if ($scope.settings.clusters.length > 1){
                                $scope.openClusterDialog();
                            }
                        }

                        if (data.logs.buffer) $scope.logs = data.logs.buffer;
                        $scope.agents = data.agents;

                }
            }, function () {
                $scope.reserror = true;
            });

            if ($scope.selectedClusterName) {
                Cluster.query({clusterName: $scope.selectedClusterName}, function (data) {

                    $scope.selectedCluster = data;
                    $scope.reserror = false;

                }, function () {
                    $scope.reserror = true;
                });

                Servers.query({clusterName: $scope.selectedClusterName}, function (data) {
                    if (!$scope.menuOpened) {
                        if (data) {
                        $scope.servers = data;
                        $scope.reserror = false;
                        }
                    }
                }, function () {
                    $scope.reserror = true;
                });

                Alerts.query({clusterName: $scope.selectedClusterName}, function (data) {
                    $scope.alerts = data;
                }, function () {
                    $scope.reserror = true;
                });

                Master.query({clusterName: $scope.selectedClusterName}, function (data) {
                    $scope.master = data;
                }, function () {
                    $scope.reserror = true;
                });

                Proxies.query({clusterName: $scope.selectedClusterName}, function (data) {
                    if (!$scope.menuOpened) {
                        $scope.proxies = data;
                        $scope.reserror = false;
                    }

                }, function () {
                    $scope.reserror = true;
                });

                Slaves.query({clusterName: $scope.selectedClusterName}, function (data) {
                    if (data) {
                    $scope.slaves = data;
                    }
                }, function () {
                    $scope.reserror = true;
                });
            }
        };

        var refreshInterval = 2000;
        var promise;
        $scope.start = function() {
          $scope.cancel();
          promise = $interval(function () {
            callServices();
        }, refreshInterval);
        };

        $scope.cancel = function () {
             $interval.cancel(promise);
        };
        // stops the interval when the scope is destroyed,
    // this usually happens when a route is changed and
    // the ItemsController $scope gets destroyed. The
    // destruction of the ItemsController scope does not
    // guarantee the stopping of any intervals, you must
    // be responsible for stopping it when the scope is
    // is destroyed.
        $scope.$on('$destroy', function() {
            $scope.cancel();
        });
        $scope.start();

        $scope.selectedUserIndex = undefined;

        var httpGetWithoutResponse = function (url) {
            $http.get(url)
                .then(
                    function () {
                        console.log("Ok.");
                    },
                    function () {
                        console.log("Error.");
                    });
        };

        $scope.switch = function (fail) {
            if (fail) {
                if (confirm("Confirm failover")) httpGetWithoutResponse(getClusterUrl() + '/actions/failover');
            } else {
                if (confirm("Confirm switchover")) httpGetWithoutResponse(getClusterUrl() + '/actions/switchover');
            }
        };

        $scope.clbootstrap = function (topo) {
            if (confirm("Bootstrap operation will destroy your existing replication setup. \n Are you really sure?")) httpGetWithoutResponse(getClusterUrl() + '/actions/replication/bootstrap/' + topo);
        };

        $scope.dbmaintenance = function (server) {
            if (confirm("Confirm maintenance for server-id: " + server)) httpGetWithoutResponse(getClusterUrl() + '/servers/' + server + '/actions/maintenance');
        };
        $scope.dbstart = function (server) {
            if (confirm("Confirm start for server-id: " + server)) httpGetWithoutResponse(getClusterUrl() + '/servers/' + server + '/actions/start');
        };
        $scope.dbstop = function (server) {
            if (confirm("Confirm stop for server-id: " + server)) httpGetWithoutResponse(getClusterUrl() + '/servers/' + server + '/actions/stop');
        };
        $scope.dbprovision = function (server) {
            if (confirm("Confirm provision server-id: " + server)) httpGetWithoutResponse(getClusterUrl() + '/servers/' + server + '/actions/provision');
        };
        $scope.dbunprovision = function (server) {
            if (confirm("Confirm unprovision for server-id: " + server)) httpGetWithoutResponse(getClusterUrl() + '/servers/' + server + '/actions/unprovision');
        };
        $scope.prxprovision = function (id) {
            if (confirm("Confirm provision proxy id: " + id)) httpGetWithoutResponse(getClusterUrl() + '/proxies/' + id + '/actions/provision');
        };
        $scope.prxunprovision = function (id) {
            if (confirm("Confirm unprovision proxy id: " + id)) httpGetWithoutResponse(getClusterUrl() + '/proxies/' + id + '/actions/unprovision');
        };
        $scope.dbreseedxtrabackup = function (server) {
            if (confirm("Confirm reseed with xtrabackup for server-id: " + server)) httpGetWithoutResponse(getClusterUrl() + '/servers/' + server + '/actions/reseed/physicalbackup');
        };
        $scope.dbreseedmysqldump = function (server) {
            if (confirm("Confirm reseed with mysqldump for server-id: " + server)) httpGetWithoutResponse(getClusterUrl() + '/servers/' + server + '/actions/reseed/logicalbackup');
        };
        $scope.dbreseedmysqldumpmaster = function (server) {
            if (confirm("Confirm reseed with mysqldump for server-id: " + server)) httpGetWithoutResponse(getClusterUrl() + '/servers/' + server + '/actions/reseed/logicalmaster');
        };
        $scope.dbxtrabackup = function (server) {
            if (confirm("Confirm sending xtrabackup for server-id: " + server)) httpGetWithoutResponse(getClusterUrl() + '/servers/' + server + '/actions/backup-physical');
        };
        $scope.dbdump = function (server) {
            if (confirm("Confirm sending mysqldump for server-id: " + server)) httpGetWithoutResponse(getClusterUrl() + '/servers/' + server + '/actions/backup-logical');
        };
        $scope.dbskipreplicationevent = function (server) {
            if (confirm("Confirm skip replication event for server-id: " + server)) httpGetWithoutResponse(getClusterUrl() + '/servers/' + server + '/actions/skip-replication-event');
        };
        $scope.dbtoogleinnodbmonitor = function (server) {
            if (confirm("Confirm toogle innodb monitor server-id: " + server)) httpGetWithoutResponse(getClusterUrl() + '/servers/' + server + '/actions/toogle-innodb-monitor');
        };
        $scope.dbtoogleslowquerycapture = function (server) {
            if (confirm("Confirm toogle slow query capture server-id: " + server)) httpGetWithoutResponse(getClusterUrl() + '/servers/' + server + '/actions/toogle-slow-query-capture');
        };
        $scope.dboptimize = function (server) {
            if (confirm("Confirm optimize for server-id: " + server)) httpGetWithoutResponse(getClusterUrl() + '/servers/' + server + '/actions/optimize');
        };

        $scope.toggletraffic = function () {
            if (confirm("Confirm toggle traffic")) httpGetWithoutResponse(getClusterUrl() + '/settings/actions/switch/database-hearbeat');
        };


        $scope.resetfail = function () {
            if (confirm("Reset Failover counter?")) httpGetWithoutResponse(getClusterUrl() + '/actions/reset-failover-counter');
        };

        $scope.setactive = function () {
            if (confirm("Confirm Active Status?")) httpGetWithoutResponse(getClusterUrl() + '/api/setactive');
        };

        $scope.provision = function () {
            if (confirm("Provision Cluster. \n Are you really sure?")) httpGetWithoutResponse(getClusterUrl() + '/services/actions/provision');
        };

        $scope.unprovision = function () {
            if (confirm("Unprovision operation will destroy your existing data. \n Are you really sure?")) httpGetWithoutResponse(getClusterUrl() + '/services/actions/unprovision');
        };

        $scope.rolling = function () {
            httpGetWithoutResponse(getClusterUrl() + '/actions/rolling');
        };


        $scope.gtidstring = function (arr) {
            var output = [];
            if (arr != null) {
                for (i = 0; i < arr.length; i++) {
                    var gtid = "";
                    gtid = arr[i].domainId + '-' + arr[i].serverId + '-' + arr[i].seqNo;
                    output.push(gtid);
                }
                return output.join(", ");
            }
            return '';
        };

        $scope.test = function () {
            if (confirm("Confirm test run, this could cause replication to break!")) httpGetWithoutResponse('/api/tests');
        };


        $scope.sysbench = function () {
            if (confirm("Confirm sysbench run !")) httpGetWithoutResponse(getClusterUrl() + '/actions/sysbench');
        };

        $scope.runonetest = function () {
            if (confirm("Confirm run one test !")) {
                httpGetWithoutResponse(getClusterUrl() + '/tests/actions/run/' + $scope.tests);
                $scope.tests = "";
            }
        };

        $scope.optimizeAll = function () {
            httpGetWithoutResponse(getClusterUrl() + '/actions/optimize');
        };

        $scope.backupphysical = function (server) {
            if (confirm("Confirm master physical backup")) httpGetWithoutResponse(getClusterUrl() + '/actions/master-physical-backup');
        };


        $scope.switchsettings = function (setting) {
            httpGetWithoutResponse(getClusterUrl() + '/settings/actions/switch/' + setting);
        };


        $scope.$watch('settings.maxdelay', function (newVal, oldVal) {
            if (typeof newVal != 'undefined') {
                httpGetWithoutResponse(getClusterUrl() + '/settings/actions/set/failover-max-slave-delay/' + newVal);
            }
        });

        $scope.setsettings = function (setting, value) {
            httpGetWithoutResponse(getClusterUrl() + '/settings/actions/set/' + setting + '/' + value);
        };

        $scope.openClusterDialog = function () {
            $scope.menuOpened = true;
            $scope.openedAt = new Date().toLocaleString();

            $mdDialog.show({
                contentElement: '#myClusterDialog',
                scope: $scope,
                preserveScope: true,
                clickOutsideToClose: false,
                escapeToClose: false,
            });

        };

        $scope.closeClusterDialog = function () {

            $mdDialog.hide({contentElement: '#myClusterDialog'});
            $scope.menuOpened = false;
            $scope.servers={};
            $scope.slaves={};
            $scope.master={};
            $scope.alerts={};
            $scope.logs={};
            $scope.proxies={};

            $mdSidenav('right').close();
        };

        $scope.newClusterDialog = function () {

            $mdDialog.show({
                contentElement: '#myNewClusterDialog',
                scope: $scope,
                preserveScope: true,
                parent: angular.element(document.body),
                clickOutsideToClose: false,
                escapeToClose: false,
            });
        };
        $scope.closeNewClusterDialog = function () {
            $mdDialog.hide({contentElement: '#myNewClusterDialog',});

            if (confirm("Confirm Creating Cluster " + $scope.dlgClusterName)) httpGetWithoutResponse('/api/clusters/actions/add/' + $scope.dlgClusterName);

            $scope.selectedClusterName = $scope.dlgClusterName;
            $scope.servers={};
            $scope.slaves={};
            $scope.master={};
            $scope.alerts={};
            $scope.logs={};
            $scope.proxies={};
            callServices();
            $scope.setClusterCredentialDialog();
            $scope.setRplCredentialDialog();
            $mdSidenav('right').close();

        };
        $scope.cancelNewClusterDialog = function () {
            $mdDialog.hide({contentElement: '#myNewClusterDialog',});
            $mdSidenav('right').close();
        };

        $scope.newServerDialog = function () {
            $mdDialog.show({
                contentElement: '#myNewServerDialog',
                parent: angular.element(document.body),
            });
        };
        $scope.closeNewServerDialog = function () {
            $mdDialog.hide({contentElement: '#myNewServerDialog',});
            if (confirm("Confirm adding new server " + $scope.dlgServerName + ":" + $scope.dlgServerPort)) httpGetWithoutResponse(getClusterUrl() + '/actions/addserver/' + $scope.dlgServerName + '/' + $scope.dlgServerPort+"/"+$scope.selectedMonitor);
        };
        $scope.cancelNewServerDialog = function () {
            $mdDialog.hide({contentElement: '#myNewServerDialog',});
        };

        $scope.setClusterCredentialDialog = function () {
            $mdDialog.show({
                contentElement: '#myClusterCredentialDialog',
                parent: angular.element(document.body),
                clickOutsideToClose: false,
                escapeToClose: false,
            });
        };
        $scope.closeClusterCredentialDialog = function () {
            $mdDialog.hide({contentElement: '#myClusterCredentialDialog',});
            if (confirm("Confirm set user/password")) httpGetWithoutResponse(getClusterUrl() + '/settings/actions/set/db-servers-credential/' + $scope.dlgClusterUser + ':' + $scope.dlgClusterPassword);
        };
        $scope.cancelClusterCredentialDialog = function () {
            $mdDialog.hide({contentElement: '#myClusterCredentialDialog',});
        };

        $scope.setRplCredentialDialog = function () {
            $mdDialog.show({
                contentElement: '#myRplCredentialDialog',
                parent: angular.element(document.body),
                clickOutsideToClose: false,
                escapeToClose: false,
            });
        };
        $scope.closeRplCredentialDialog = function () {
            $mdDialog.hide({contentElement: '#myRplCredentialDialog',});
            if (confirm("Confirm set user/password")) httpGetWithoutResponse(getClusterUrl() + '/settings/actions/set/replication-credential/' + $scope.dlgRplUser + ':' + $scope.dlgRplPassword);
        };
        $scope.cancelRplCredentialDialog = function () {
            $mdDialog.hide({contentElement: '#myRplCredentialDialog',});
        };

        $scope.openDebugClusterDialog = function () {
            $mdDialog.show({
                contentElement: '#myClusterDebugDialog',
                parent: angular.element(document.body),
            });
            $scope.menuOpened = true;
        };
        $scope.closeDebugClusterDialog = function () {
            $mdDialog.hide({contentElement: '#myClusterDebugDialog',});
            $scope.menuOpened = false;
        };

        $scope.openDebugServerDialog = function () {
            $mdDialog.show({
                contentElement: '#myServerDebugDialog',
                parent: angular.element(document.body),
            });
        };
        $scope.closeDebugServerDialog = function () {
            $mdDialog.hide({contentElement: '#myServerDebugDialog',});
        };


        $scope.selectUserIndex = function (index) {
            var r = confirm("Confirm select Index  " + index);
            if ($scope.selectedUserIndex !== index) {
                $scope.selectedUserIndex = index;
            }
            else {
                $scope.selectedUserIndex = undefined;
            }
        };

        $scope.toggleLeft = buildToggler('left');
        $scope.toggleRight = buildToggler('right');

        function buildToggler(componentId) {
            return function () {
                $mdSidenav(componentId).toggle();

            };
        }


        $scope.$on('$mdMenuOpen', function (event, menu) {
            console.log('Opening menu refresh server will stop...', event, menu);
            $scope.menuOpened = true;
            $scope.openedAt = new Date().toLocaleString();
        });

        $scope.$on('$mdMenuClose', function (event, menu) {
            console.log('Closing menu refresh servers will resume...', event, menu);
            $scope.menuOpened = false;
            $scope.openedAt = "";
        });


    });
