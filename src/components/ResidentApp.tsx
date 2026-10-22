// @ts-nocheck
  "use strict";

  Object.defineProperty(exports, '__esModule', {
    value: true
  });
  function _interopDefault(e) {
    return e && e.__esModule ? e : {
      default: e
    };
  }
  function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = {};
    if (e) Object.keys(e).forEach(function (k) {
      var d = Object.getOwnPropertyDescriptor(e, k);
      Object.defineProperty(n, k, d.get ? d : {
        enumerable: true,
        get: function () {
          return e[k];
        }
      });
    });
    n.default = e;
    return n;
  }
  var _react = require("react");
  var _reactNativeWebDistExportsAlert = require("react-native-web/dist/exports/Alert");
  var Alert = _interopDefault(_reactNativeWebDistExportsAlert);
  var _reactNativeWebDistExportsImage = require("react-native-web/dist/exports/Image");
  var Image = _interopDefault(_reactNativeWebDistExportsImage);
  var _reactNativeWebDistExportsModal = require("react-native-web/dist/exports/Modal");
  var Modal = _interopDefault(_reactNativeWebDistExportsModal);
  var _reactNativeWebDistExportsPressable = require("react-native-web/dist/exports/Pressable");
  var Pressable = _interopDefault(_reactNativeWebDistExportsPressable);
  var _reactNativeWebDistExportsScrollView = require("react-native-web/dist/exports/ScrollView");
  var ScrollView = _interopDefault(_reactNativeWebDistExportsScrollView);
  var _componentsPwaText = require("@/components/pwa-text");
  var Text = { default: _componentsPwaText.PwaText };
  var _reactNativeWebDistExportsView = require("react-native-web/dist/exports/View");
  var View = _interopDefault(_reactNativeWebDistExportsView);
  var _expoRouter = require("expo-router");
  var _reactNativeSafeAreaContext = require("react-native-safe-area-context");
  var _expoWebBrowser = require("expo-web-browser");
  var WebBrowser = _interopNamespace(_expoWebBrowser);
  var _expoDocumentPicker = require("expo-document-picker");
  var DocumentPicker = _interopNamespace(_expoDocumentPicker);
  var _expoCamera = require("expo-camera");
  var _libSupabase = require("@/lib/supabase");
  var _componentsUi = require("@/components/ui");
  var _registrationForm = require("@/components/registration-form");
  var _chatScreen = require("@/components/chat-screen");
  var _requestsScreen = require("@/components/requests-screen");
  var _updatesScreen = require("@/components/updates-screen");
  var _profileScreen = require("@/components/profile-screen");
  var _componentsChatRequestForm = require("@/components/chat-request-form");
  var _libChatDocumentForms = require("@/lib/chat-document-forms");
  var _reactJsxRuntime = require("react/jsx-runtime");
  /* eslint react-hooks/set-state-in-effect: off, react/no-unescaped-entities: off */

  const ROUTES = {
    home: '/home',
    requests: '/requests',
    updates: '/announcements',
    chat: '/chat',
    profile: '/profile',
    'new-request': '/requests/new',
    login: '/login',
    register: '/register',
    pending: '/pending-approval'
  };
  const TABS = [{
    id: 'home',
    label: 'Home',
    icon: 'home'
  }, {
    id: 'requests',
    label: 'Requests',
    icon: 'assignment'
  }, {
    id: 'updates',
    label: 'Updates',
    icon: 'campaign'
  }, {
    id: 'chat',
    label: 'AI Chat',
    icon: 'chat'
  }, {
    id: 'profile',
    label: 'Profile',
    icon: 'person'
  }];
  const show = e => e instanceof Error ? e.message : 'Something went wrong. Please try again.';
  function ResidentApp({
    initial = 'home'
  }) {
    const [screen, setScreen] = (0, _react.useState)(initial);
    const [user, setUser] = (0, _react.useState)(null);
    const [authReady, setAuthReady] = (0, _react.useState)(false);
    const [loading, setLoading] = (0, _react.useState)(false);
    const [error, setError] = (0, _react.useState)('');
    const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
    (0, _react.useEffect)(() => {
      if (!_libSupabase.supabase) {
        setAuthReady(true);
        return;
      }
      _libSupabase.supabase.auth.getUser().then(({
        data
      }) => {
        setUser(data.user);
        setAuthReady(true);
        if (!data.user && !['login', 'register', 'pending', 'chat'].includes(initial)) _expoRouter.router.replace('/login');
        if (data.user && initial === 'login') _expoRouter.router.replace('/home');
      });
      const {
        data
      } = _libSupabase.supabase.auth.onAuthStateChange((_e, s) => {
        setUser(s?.user || null);
        setAuthReady(true);
      });
      return () => data.subscription.unsubscribe();
    }, []);
    const navigate = to => {
      setError('');
      if (to === screen) {
        setScreen(to);
        return;
      }
      _expoRouter.router.replace(ROUTES[to]);
    };
    return (0, _reactJsxRuntime.jsxs)(View.default, {
      style: {
        flex: 1,
        backgroundColor: _componentsUi.C.bg
      },
      children: [!['login', 'register'].includes(screen) && (0, _reactJsxRuntime.jsxs)(View.default, {
        style: {
          height: 56,
          backgroundColor: _componentsUi.C.white,
          borderBottomColor: '#f1f5f9',
          borderBottomWidth: 1,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexDirection: 'row'
        },
        children: [(0, _reactJsxRuntime.jsxs)(Pressable.default, {
          onPress: () => navigate('home'),
          style: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8
          },
          children: [(0, _reactJsxRuntime.jsx)(Image.default, {
            source: require("@/assets/images/barangay-logo.png"),
            style: {
              width: 30,
              height: 30,
              resizeMode: 'contain'
            }
          }), (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 16,
              fontWeight: '800',
              color: _componentsUi.C.text
            },
            children: "Smart Barangay"
          })]
        }), user ? (0, _reactJsxRuntime.jsx)(NotificationCenter, {
          user: user,
          go: navigate
        }) : (0, _reactJsxRuntime.jsx)(Pressable.default, {
          onPress: () => navigate('login'),
          children: (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 12,
              color: _componentsUi.C.blue,
              fontWeight: '700'
            },
            children: "Sign in"
          })
        })]
      }), !authReady && !['login', 'register', 'chat'].includes(screen) ? (0, _reactJsxRuntime.jsx)(View.default, {
        style: {
          flex: 1,
          backgroundColor: _componentsUi.C.bg
        }
      }) : (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
        children: [screen === 'home' && (0, _reactJsxRuntime.jsx)(Home, {
          go: navigate,
          user: user
        }), screen === 'requests' && (0, _reactJsxRuntime.jsx)(Requests, {
          go: navigate
        }), screen === 'new-request' && (0, _reactJsxRuntime.jsx)(NewRequest, {
          back: () => navigate('requests')
        }), screen === 'updates' && (0, _reactJsxRuntime.jsx)(Updates, { user: user }), screen === 'chat' && (0, _reactJsxRuntime.jsx)(Chat, {
          user: user
        }), screen === 'profile' && (0, _reactJsxRuntime.jsx)(Profile, {
          user: user,
          go: navigate,
          onSignedOut: () => setUser(null)
        }), screen === 'login' && (0, _reactJsxRuntime.jsx)(Login, {
          go: navigate,
          onUser: setUser
        }), screen === 'register' && (0, _reactJsxRuntime.jsx)(Register, {
          go: navigate
        }), screen === 'pending' && (0, _reactJsxRuntime.jsx)(Pending, {
          go: navigate,
          onSignedOut: () => setUser(null)
        })]
      }), user && TABS.some(t => t.id === screen) && (0, _reactJsxRuntime.jsx)(View.default, {
        style: {
          height: 64,
          paddingBottom: Math.min(insets.bottom, 18),
          backgroundColor: _componentsUi.C.white,
          borderTopColor: '#f3f4f6',
          borderTopWidth: 1,
          shadowColor: '#000000',
          shadowOffset: {
            width: 0,
            height: -4
          },
          shadowOpacity: 0.06,
          shadowRadius: 20,
          elevation: 8,
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center'
        },
        children: TABS.map(t => (0, _reactJsxRuntime.jsxs)(Pressable.default, {
          onPress: () => navigate(t.id),
          style: {
            alignItems: 'center',
            minWidth: 56
          },
          children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Icon, {
            name: t.icon,
            size: 20,
            color: screen === t.id ? _componentsUi.C.blue : '#94a3b8'
          }), (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 10,
              color: screen === t.id ? _componentsUi.C.blue : '#94a3b8',
              fontWeight: screen === t.id ? '700' : '500'
            },
            children: t.label
          })]
        }, t.id))
      })]
    });
  }
  function NotificationCenter({
    user,
    go
  }) {
    const [open, setOpen] = (0, _react.useState)(false);
    const [items, setItems] = (0, _react.useState)([]);
    (0, _react.useEffect)(() => {
      const client = _libSupabase.supabase;
      if (!client || !user) return;
      const load = async () => {
        const {
          data
        } = await client.from('notifications').select('id,title,message,read_status,created_at').eq('user_id', user.id).order('created_at', {
          ascending: false
        }).limit(10);
        setItems(data || []);
      };
      void load();
      const channel = client.channel('resident-mobile-notifications').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => void load()).subscribe();
      return () => {
        void client.removeChannel(channel);
      };
    }, [user]);
    const unread = items.filter(x => !x.read_status).length;
    async function markRead(id) {
      const client = _libSupabase.supabase;
      if (!client) return;
      const {
        error
      } = await client.from('notifications').update({
        read_status: true
      }).eq('id', id).eq('user_id', user.id);
      if (!error) setItems(rows => rows.map(x => x.id === id ? {
        ...x,
        read_status: true
      } : x));
    }
    return (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
      children: [(0, _reactJsxRuntime.jsxs)(Pressable.default, {
        accessibilityRole: "button",
        accessibilityLabel: `Notifications, ${unread} unread`,
        onPress: () => setOpen(true),
        style: {
          width: 42,
          height: 42,
          alignItems: 'center',
          justifyContent: 'center'
        },
        children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Icon, {
          name: "notifications",
          size: 21,
          color: "#475569"
        }), unread > 0 && (0, _reactJsxRuntime.jsx)(View.default, {
          style: {
            position: 'absolute',
            right: 4,
            top: 4,
            minWidth: 16,
            height: 16,
            paddingHorizontal: 3,
            borderRadius: 8,
            backgroundColor: '#ef4444',
            alignItems: 'center',
            justifyContent: 'center'
          },
          children: (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 9,
              fontWeight: '800',
              color: _componentsUi.C.white
            },
            children: unread > 9 ? '9+' : unread
          })
        })]
      }), (0, _reactJsxRuntime.jsx)(Modal.default, {
        visible: open,
        transparent: true,
        animationType: "fade",
        onRequestClose: () => setOpen(false),
        children: (0, _reactJsxRuntime.jsx)(Pressable.default, {
          onPress: () => setOpen(false),
          style: {
            flex: 1,
            backgroundColor: '#0006',
            justifyContent: 'flex-start',
            alignItems: 'flex-end',
            paddingTop: 62,
            paddingHorizontal: 12
          },
          children: (0, _reactJsxRuntime.jsxs)(Pressable.default, {
            onPress: e => e.stopPropagation(),
            style: {
              width: 300,
              maxHeight: '70%',
              backgroundColor: _componentsUi.C.white,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: _componentsUi.C.border,
              overflow: 'hidden'
            },
            children: [(0, _reactJsxRuntime.jsxs)(_componentsUi.Row, {
              children: [(0, _reactJsxRuntime.jsx)(Text.default, {
                style: {
                  padding: 15,
                  fontSize: 14,
                  fontWeight: '800',
                  color: _componentsUi.C.text
                },
                children: "Notifications"
              }), (0, _reactJsxRuntime.jsx)(_componentsUi.Icon, {
                name: "done_all",
                size: 18,
                color: _componentsUi.C.blue
              })]
            }), (0, _reactJsxRuntime.jsx)(ScrollView.default, {
              children: items.length === 0 ? (0, _reactJsxRuntime.jsx)(Text.default, {
                style: {
                  padding: 20,
                  textAlign: 'center',
                  fontSize: 12,
                  color: _componentsUi.C.muted
                },
                children: "No new notifications"
              }) : items.map(n => (0, _reactJsxRuntime.jsxs)(Pressable.default, {
                onPress: () => void markRead(n.id),
                style: {
                  padding: 13,
                  borderTopWidth: 1,
                  borderColor: '#f1f5f9',
                  backgroundColor: n.read_status ? _componentsUi.C.white : '#eff6ff'
                },
                children: [(0, _reactJsxRuntime.jsx)(Text.default, {
                  style: {
                    fontSize: 12,
                    fontWeight: '800',
                    color: _componentsUi.C.text
                  },
                  children: n.title
                }), (0, _reactJsxRuntime.jsx)(Text.default, {
                  style: {
                    marginTop: 4,
                    fontSize: 11,
                    lineHeight: 16,
                    color: '#475569'
                  },
                  children: n.message
                }), (0, _reactJsxRuntime.jsx)(Text.default, {
                  style: {
                    marginTop: 4,
                    fontSize: 10,
                    color: '#94a3b8'
                  },
                  children: new Date(n.created_at).toLocaleString()
                })]
              }, n.id))
            }), (0, _reactJsxRuntime.jsx)(Pressable.default, {
              onPress: () => {
                setOpen(false);
                go('updates');
              },
              style: {
                borderTopWidth: 1,
                borderColor: '#f1f5f9',
                padding: 12,
                alignItems: 'center'
              },
              children: (0, _reactJsxRuntime.jsx)(Text.default, {
                style: {
                  fontSize: 12,
                  fontWeight: '800',
                  color: _componentsUi.C.blue
                },
                children: "View all updates"
              })
            })]
          })
        })
      })]
    });
  }
  function Home({
    go,
    user
  }) {
    const [ann, setAnn] = (0, _react.useState)(null);
    const [req, setReq] = (0, _react.useState)(null);
    const [busy, setBusy] = (0, _react.useState)(true);
    const load = (0, _react.useCallback)(async () => {
      if (!_libSupabase.supabase) {
        setBusy(false);
        return;
      }
      if (!user?.id) return;
      try {
        const {
          data: a,
          error: annError
        } = await _libSupabase.supabase.from('announcements').select('id,title,description,category,published_date').eq('status', 'Published').order('published_date', {
          ascending: false
        }).limit(1).maybeSingle();
        if (annError) throw annError;
        setAnn(a);
        const {
          data: r,
          error: residentError
        } = await _libSupabase.supabase.from('residents').select('id').eq('user_id', user.id).maybeSingle();
        if (residentError) throw residentError;
        if (r?.id) {
          const {
            data: q,
            error: requestError
          } = await _libSupabase.supabase.from('document_requests').select('id,status,requested_date,document_type:document_types(name)').eq('resident_id', r.id).order('requested_date', {
            ascending: false
          }).limit(1).maybeSingle();
          if (requestError) throw requestError;
          setReq(q);
        } else setReq(null);
      } catch {} finally {
        setBusy(false);
      }
    }, [user]);
    (0, _react.useEffect)(() => {
      void load();
    }, [load]);
    const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Resident';
    return (0, _reactJsxRuntime.jsxs)(_componentsUi.Page, {
      children: [(0, _reactJsxRuntime.jsxs)(View.default, {
        style: {
          backgroundColor: _componentsUi.C.blue,
          borderRadius: 20,
          padding: 18,
          gap: 5
        },
        children: [(0, _reactJsxRuntime.jsxs)(Text.default, {
          style: {
            fontSize: 10,
            color: '#bfdbfe',
            fontWeight: '800',
            letterSpacing: 1
          },
          children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Icon, {
            name: "auto_awesome",
            size: 13,
            color: "#fcd34d"
          }), " SMART BARANGAY RESIDENT PORTAL"]
        }), (0, _reactJsxRuntime.jsxs)(Text.default, {
          style: {
            fontSize: 22,
            fontWeight: '900',
            color: 'white'
          },
          children: ["Hello, ", name]
        }), (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontSize: 12,
            color: '#dbeafe'
          },
          children: "Welcome to your online barangay services portal."
        })]
      }), (0, _reactJsxRuntime.jsxs)(View.default, {
        children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Label, {
          children: "Quick Barangay Services"
        }), (0, _reactJsxRuntime.jsx)(View.default, {
          style: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10
          },
          children: ['Barangay Clearance', 'Indigency Certificate', 'Business Permit', 'AI Resident Assistant'].map((x, i) => (0, _reactJsxRuntime.jsxs)(Pressable.default, {
            onPress: () => go(i === 3 ? 'chat' : 'new-request'),
            style: {
              width: '48%',
              minHeight: 92,
              borderRadius: 16,
              borderColor: '#dbeafe',
              borderWidth: 1,
              backgroundColor: '#eff6ff',
              padding: 13,
              justifyContent: 'space-between'
            },
            children: [(0, _reactJsxRuntime.jsx)(View.default, {
              style: {
                padding: 8,
                borderRadius: 12,
                backgroundColor: _componentsUi.C.white
              },
              children: (0, _reactJsxRuntime.jsx)(_componentsUi.Icon, {
                name: ['description', 'assignment_turned_in', 'business', 'smart_toy'][i],
                size: 20,
                color: _componentsUi.C.blue
              })
            }), (0, _reactJsxRuntime.jsx)(Text.default, {
              style: {
                fontSize: 12,
                fontWeight: '800',
                color: _componentsUi.C.text
              },
              children: x
            })]
          }, x))
        })]
      }), (0, _reactJsxRuntime.jsxs)(_componentsUi.Row, {
        children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Label, {
          children: "Latest Barangay Advisory"
        }), (0, _reactJsxRuntime.jsx)(Pressable.default, {
          onPress: () => go('updates'),
          children: (0, _reactJsxRuntime.jsxs)(Text.default, {
            style: {
              fontSize: 12,
              color: _componentsUi.C.blue,
              fontWeight: '700'
            },
            children: ["View all ", (0, _reactJsxRuntime.jsx)(_componentsUi.Icon, {
              name: "chevron_right",
              size: 14,
              color: _componentsUi.C.blue
            })]
          })
        })]
      }), ann ? (0, _reactJsxRuntime.jsxs)(_componentsUi.Card, {
        children: [(0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontSize: 10,
            fontWeight: '800',
            color: _componentsUi.C.blue
          },
          children: ann.category || 'General'
        }), (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontSize: 15,
            fontWeight: '800',
            color: _componentsUi.C.text
          },
          children: ann.title
        }), (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontSize: 12,
            color: _componentsUi.C.muted
          },
          children: ann.description
        })]
      }) : (0, _reactJsxRuntime.jsx)(_componentsUi.Card, {
        children: (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            textAlign: 'center',
            fontSize: 12,
            color: _componentsUi.C.muted
          },
          children: busy ? 'Loading updates...' : 'No active announcements'
        })
      }), (0, _reactJsxRuntime.jsxs)(_componentsUi.Row, {
        children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Label, {
          children: "My Document Requests"
        }), (0, _reactJsxRuntime.jsx)(Pressable.default, {
          onPress: () => go('requests'),
          children: (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 12,
              color: _componentsUi.C.blue,
              fontWeight: '700'
            },
            children: "View all"
          })
        })]
      }), (0, _reactJsxRuntime.jsx)(_componentsUi.Card, {
        children: req ? (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
          children: [(0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontWeight: '800',
              color: _componentsUi.C.text
            },
            children: req.document_type?.name || 'Barangay Document'
          }), (0, _reactJsxRuntime.jsxs)(Text.default, {
            style: {
              fontSize: 11,
              color: _componentsUi.C.muted
            },
            children: ["Submitted ", new Date(req.requested_date).toLocaleDateString()]
          }), (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              color: _componentsUi.C.green,
              fontWeight: '800'
            },
            children: req.status
          })]
        }) : (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
          children: [(0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              textAlign: 'center',
              color: _componentsUi.C.muted,
              fontSize: 12
            },
            children: "No active requests pending"
          }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
            title: 'Submit a request ' + String.fromCharCode(8594),
            onPress: () => go('new-request'),
            secondary: true
          })]
        })
      })]
    });
  }
  function Requests({ go }) {
    return (0, _reactJsxRuntime.jsx)(_requestsScreen.RequestsScreen, { go });
  }
  function NewRequest({
    back
  }) {
    const [types, setTypes] = (0, _react.useState)([]);
    const [selected, setSelected] = (0, _react.useState)(null);
    const [purpose, setPurpose] = (0, _react.useState)('');
    const [files, setFiles] = (0, _react.useState)({});
    const [busy, setBusy] = (0, _react.useState)(false);
    const [err, setErr] = (0, _react.useState)('');
    const [done, setDone] = (0, _react.useState)(false);
    (0, _react.useEffect)(() => {
      _libSupabase.supabase?.from('document_types').select('*').order('name').then(({
        data
      }) => setTypes(data || []));
    }, []);
    async function pick(req) {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true
      });
      if (result.canceled) return;
      const f = result.assets[0];
      const ext = f.name.split('.').pop()?.toLowerCase();
      if ((f.size || 0) > 5 * 1024 * 1024) return setErr(`File for ${req} exceeds 5MB.`);
      if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) return setErr('Only PDF, JPG and PNG files are allowed.');
      setErr('');
      setFiles(v => ({
        ...v,
        [req]: f
      }));
    }
    async function submit() {
      try {
        if (!_libSupabase.supabase) throw Error('Supabase is not configured.');
        if (!selected) throw Error('Select a document type.');
        if (!purpose.trim() || purpose.length > 2000) throw Error('Enter a purpose (up to 2000 characters).');
        const reqs = selected.requirements_json || [];
        const missing = reqs.filter(r => !files[r]);
        if (missing.length) throw Error(`Missing required attachments: ${missing.join(', ')}`);
        setBusy(true);
        const {
          data: {
            user
          }
        } = await _libSupabase.supabase.auth.getUser();
        if (!user) throw Error('Sign in before submitting.');
        const {
          data: resident
        } = await _libSupabase.supabase.from('residents').select('id').eq('user_id', user.id).single();
        if (!resident) throw Error('Resident profile not found.');
        const attachments = [];
        for (const req of reqs) {
          const f = files[req];
          const path = `${user.id}/req_${Date.now()}_${f.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const res = await fetch(f.uri);
          const blob = await res.blob();
          const {
            error
          } = await _libSupabase.supabase.storage.from('document-requirements').upload(path, blob, {
            contentType: f.mimeType || 'application/octet-stream',
            upsert: false
          });
          if (error) throw error;
          attachments.push({
            requirement: req,
            storage_path: `document-requirements/${path}`,
            mime_type: f.mimeType,
            size: f.size
          });
        }
        const {
          error
        } = await _libSupabase.supabase.from('document_requests').insert({
          resident_id: resident.id,
          document_type_id: selected.id,
          status: 'Pending',
          remarks: purpose.trim(),
          requested_date: new Date().toISOString(),
          form_data: {
            attachments
          }
        });
        if (error) throw error;
        setDone(true);
      } catch (e) {
        setErr(show(e));
      } finally {
        setBusy(false);
      }
    }
    if (done) return (0, _reactJsxRuntime.jsx)(_componentsUi.Page, {
      children: (0, _reactJsxRuntime.jsxs)(_componentsUi.Card, {
        children: [(0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontSize: 24,
            textAlign: 'center',
            color: _componentsUi.C.green
          }
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Title, {
          children: "Request Submitted!"
        }), (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            color: _componentsUi.C.muted
          },
          children: "Your application has been sent to the Barangay Hall."
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
          title: "Track request status",
          onPress: back
        })]
      })
    });
    return (0, _reactJsxRuntime.jsxs)(_componentsUi.Page, {
      children: [(0, _reactJsxRuntime.jsx)(Pressable.default, {
        onPress: back,
        children: (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            color: _componentsUi.C.blue,
            fontWeight: '700'
          },
          children: "Back to requests"
        })
      }), (0, _reactJsxRuntime.jsx)(_componentsUi.Title, {
        sub: "Submit an online document application",
        children: "Request Document"
      }), !!err && (0, _reactJsxRuntime.jsx)(_componentsUi.ErrorBox, {
        children: err
      }), (0, _reactJsxRuntime.jsx)(_componentsUi.Label, {
        children: "1. Select Document Type"
      }), types.map(t => (0, _reactJsxRuntime.jsx)(Pressable.default, {
        onPress: () => {
          setSelected(t);
          setFiles({});
        },
        children: (0, _reactJsxRuntime.jsxs)(_componentsUi.Card, {
          style: selected?.id === t.id ? {
            borderColor: _componentsUi.C.blue,
            backgroundColor: '#eff6ff'
          } : {},
          children: [(0, _reactJsxRuntime.jsxs)(Text.default, {
            style: {
              fontWeight: '800',
              color: _componentsUi.C.text
            },
            children: [t.name, t.name?.toLowerCase().includes('business') ? ' - In-person only' : '']
          }), (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 11,
              color: _componentsUi.C.muted
            },
            children: t.description
          })]
        })
      }, t.id)), selected && (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
        children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Label, {
          children: "2. Purpose"
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Input, {
          value: purpose,
          onChangeText: setPurpose,
          placeholder: "Explain why you need this document",
          multiline: true,
          maxLength: 2000,
          style: {
            minHeight: 82,
            textAlignVertical: 'top'
          }
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Label, {
          children: "3. Required attachments"
        }), (selected.requirements_json || []).map(req => (0, _reactJsxRuntime.jsxs)(_componentsUi.Card, {
          children: [(0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontWeight: '700',
              color: _componentsUi.C.text
            },
            children: req
          }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
            title: files[req]?.name || 'Choose PDF / JPG / PNG',
            secondary: true,
            onPress: () => void pick(req)
          })]
        }, req)), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
          title: "Submit request",
          onPress: () => void submit(),
          loading: busy
        })]
      })]
    });
  }
  function Updates({ user }) {
    return (0, _reactJsxRuntime.jsx)(_updatesScreen.UpdatesScreen, { user });
  }
  function Chat({ user }) {
    return (0, _reactJsxRuntime.jsx)(_chatScreen.ChatScreen, { user });
  }
  function Login({
    go,
    onUser
  }) {
    const [username, setUsername] = (0, _react.useState)('');
    const [password, setPassword] = (0, _react.useState)('');
    const [showPassword, setShowPassword] = (0, _react.useState)(false);
    const [busy, setBusy] = (0, _react.useState)(false);
    const [err, setErr] = (0, _react.useState)('');
    async function submit() {
      setErr('');
      const resident = /^BRY-\d{4}-\d+$/i.test(username.trim());
      if (!username.trim() || !password) return setErr('Enter your email or Resident Code and password.');
      if (!resident && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username.trim())) return setErr('Enter a valid email or Resident Code (e.g. BRY-2026-00001).');
      setBusy(true);
      try {
        if (!_libSupabase.supabase) throw Error('Supabase is not configured.');
        const {
          data,
          error
        } = await _libSupabase.supabase.auth.signInWithPassword({
          email: resident ? username.trim().toLowerCase() + '@smartbarangay.local' : username.trim(),
          password
        });
        if (error) throw error;
        onUser(data.user);
        go('home');
      } catch (e) {
        setErr(show(e));
      } finally {
        setBusy(false);
      }
    }
    return (0, _reactJsxRuntime.jsx)(View.default, {
      style: {
        flex: 1,
        backgroundColor: _componentsUi.C.white
      },
      children: (0, _reactJsxRuntime.jsxs)(ScrollView.default, {
        contentContainerStyle: {
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingVertical: 32,
          alignSelf: 'center',
          width: '100%',
          maxWidth: 440,
          gap: 14
        },
        keyboardShouldPersistTaps: "handled",
        children: [(0, _reactJsxRuntime.jsxs)(View.default, {
          style: {
            alignItems: 'center',
            marginBottom: 14
          },
          children: [(0, _reactJsxRuntime.jsx)(Image.default, {
            source: require("@/assets/images/barangay-logo.png"),
            style: {
              width: 64,
              height: 64,
              resizeMode: 'contain',
              marginBottom: 8
            }
          }), (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 24,
              fontWeight: '800',
              letterSpacing: -.5,
              color: '#111827'
            },
            children: "Smart Barangay"
          }), (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 14,
              color: '#64748b',
              marginTop: 2
            },
            children: "Sign in to your account"
          })]
        }), !!err && (0, _reactJsxRuntime.jsx)(_componentsUi.ErrorBox, {
          children: err
        }), (0, _reactJsxRuntime.jsxs)(View.default, {
          children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Label, {
            children: "Email or Resident Code"
          }), (0, _reactJsxRuntime.jsx)(_componentsUi.Input, {
            value: username,
            onChangeText: setUsername,
            placeholder: "you@example.com or BRY-2026-00001",
            autoCapitalize: "none",
            autoCorrect: false,
            editable: !busy,
            style: {
              backgroundColor: '#f9fafb',
              borderColor: '#e5e7eb',
              borderRadius: 12,
              paddingHorizontal: 15,
              paddingVertical: 12,
              fontSize: 14
            }
          })]
        }), (0, _reactJsxRuntime.jsxs)(View.default, {
          children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Label, {
            children: "Password"
          }), (0, _reactJsxRuntime.jsxs)(View.default, {
            style: {
              position: 'relative',
              justifyContent: 'center'
            },
            children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Input, {
              value: password,
              onChangeText: setPassword,
              secureTextEntry: !showPassword,
              placeholder: "????????",
              editable: !busy,
              onSubmitEditing: () => void submit(),
              returnKeyType: "go",
              style: {
                backgroundColor: '#f9fafb',
                borderColor: '#e5e7eb',
                borderRadius: 12,
                paddingHorizontal: 15,
                paddingVertical: 12,
                paddingRight: 46,
                fontSize: 14
              }
            }), (0, _reactJsxRuntime.jsx)(Pressable.default, {
              accessibilityRole: "button",
              accessibilityLabel: showPassword ? 'Hide password' : 'Show password',
              onPress: () => setShowPassword(v => !v),
              style: {
                position: 'absolute',
                right: 12,
                padding: 8
              },
              children: (0, _reactJsxRuntime.jsx)(_componentsUi.Icon, {
                name: showPassword ? 'visibility_off' : 'visibility',
                size: 18,
                color: "#94a3b8"
              })
            })]
          })]
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
          title: busy ? 'Signing In...' : 'Sign In',
          onPress: () => void submit(),
          loading: busy
        }), (0, _reactJsxRuntime.jsxs)(Text.default, {
          style: {
            textAlign: 'center',
            fontSize: 14,
            color: '#64748b',
            marginTop: 8
          },
          children: ["Don't have an account? ", (0, _reactJsxRuntime.jsx)(Text.default, {
            onPress: () => go('register'),
            style: {
              color: _componentsUi.C.blue,
              fontWeight: '500'
            },
            children: "Register"
          })]
        }), (0, _reactJsxRuntime.jsxs)(View.default, {
          style: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginTop: 4
          },
          children: [(0, _reactJsxRuntime.jsx)(View.default, {
            style: {
              flex: 1,
              height: 1,
              backgroundColor: '#e5e7eb'
            }
          }), (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 12,
              color: '#94a3b8'
            },
            children: "or"
          }), (0, _reactJsxRuntime.jsx)(View.default, {
            style: {
              flex: 1,
              height: 1,
              backgroundColor: '#e5e7eb'
            }
          })]
        }), (0, _reactJsxRuntime.jsxs)(Pressable.default, {
          onPress: () => go('chat'),
          style: {
            minHeight: 58,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#bfdbfe',
            backgroundColor: _componentsUi.C.white,
            paddingHorizontal: 14,
            paddingVertical: 8
          },
          children: [(0, _reactJsxRuntime.jsx)(Image.default, {
            source: require("@/assets/images/ate-sora.jpg"),
            style: {
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: '#dbeafe'
            }
          }), (0, _reactJsxRuntime.jsxs)(View.default, {
            children: [(0, _reactJsxRuntime.jsx)(Text.default, {
              style: {
                fontSize: 14,
                fontWeight: '700',
                color: '#1f2937'
              },
              children: "Continue as Guest"
            }), (0, _reactJsxRuntime.jsx)(Text.default, {
              style: {
                fontSize: 11,
                color: '#64748b',
                marginTop: 2
              },
              children: "Chat with Ate Sora ? AI Chat Only"
            })]
          })]
        })]
      })
    });
  }
  function Register({ go }) {
    return (0, _reactJsxRuntime.jsx)(_registrationForm.RegistrationForm, { go });
  }
  function Pending({
    go,
    onSignedOut
  }) {
    const [status, setStatus] = (0, _react.useState)(null);
    const [busy, setBusy] = (0, _react.useState)(false);
    const load = (0, _react.useCallback)(async () => {
      setBusy(true);
      try {
        const {
          data: {
            user
          }
        } = await _libSupabase.supabase.auth.getUser();
        if (user) {
          const {
            data
          } = await _libSupabase.supabase.from('residents').select('verification_status,rejection_reason').eq('user_id', user.id).maybeSingle();
          setStatus(data);
        }
      } finally {
        setBusy(false);
      }
    }, []);
    (0, _react.useEffect)(() => {
      void load();
    }, [load]);
    return (0, _reactJsxRuntime.jsx)(_componentsUi.Page, {
      children: (0, _reactJsxRuntime.jsxs)(_componentsUi.Card, {
        style: {
          alignItems: 'center',
          padding: 24
        },
        children: [(0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontSize: 36,
            color: status?.verification_status === 'Verified' ? _componentsUi.C.green : status?.verification_status === 'Rejected' ? _componentsUi.C.red : '#d97706'
          },
          children: (0, _reactJsxRuntime.jsx)(_componentsUi.Icon, {
            name: status?.verification_status === 'Verified' ? 'check_circle' : status?.verification_status === 'Rejected' ? 'error' : 'schedule',
            size: 34,
            color: status?.verification_status === 'Verified' ? _componentsUi.C.green : status?.verification_status === 'Rejected' ? _componentsUi.C.red : '#d97706'
          })
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Title, {
          children: status?.verification_status === 'Verified' ? 'Account verified' : status?.verification_status === 'Rejected' ? 'Registration rejected' : 'Account awaiting barangay verification'
        }), (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            textAlign: 'center',
            color: _componentsUi.C.muted
          },
          children: status?.verification_status === 'Verified' ? 'Your resident account is approved.' : status?.verification_status === 'Rejected' ? 'Your registration needs correction.' : "Barangay staff will review your details and uploaded ID before enabling resident services."
        }), status?.rejection_reason && (0, _reactJsxRuntime.jsxs)(Text.default, {
          style: {
            color: _componentsUi.C.red
          },
          children: ["Reason: ", status.rejection_reason]
        }), status?.verification_status === 'Verified' ? (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
          title: "Continue to Home",
          onPress: () => go('home')
        }) : (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
          title: "Refresh status",
          onPress: () => void load(),
          loading: busy
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
          title: "Sign Out",
          secondary: true,
          onPress: async () => {
            await _libSupabase.supabase?.auth.signOut();
            onSignedOut();
            go('login');
          }
        })]
      })
    });
  }
  function Profile({ user, go, onSignedOut }) {
    return (0, _reactJsxRuntime.jsx)(_profileScreen.ProfileScreen, { user, go, onSignedOut });
  }
  function QRScanner({
    onScan,
    onClose
  }) {
    const [permission, requestPermission] = (0, _expoCamera.useCameraPermissions)();
    return (0, _reactJsxRuntime.jsxs)(View.default, {
      style: {
        flex: 1,
        backgroundColor: '#000'
      },
      children: [permission?.granted ? (0, _reactJsxRuntime.jsx)(_expoCamera.CameraView, {
        style: {
          flex: 1
        },
        facing: "back",
        barcodeScannerSettings: {
          barcodeTypes: ['qr']
        },
        onBarcodeScanned: ({
          data
        }) => onScan(data)
      }) : (0, _reactJsxRuntime.jsxs)(View.default, {
        style: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 14
        },
        children: [(0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            color: 'white',
            textAlign: 'center'
          },
          children: "Allow camera access to scan a payment QR code."
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
          title: "Allow camera",
          onPress: () => void requestPermission()
        })]
      }), (0, _reactJsxRuntime.jsx)(Pressable.default, {
        onPress: onClose,
        style: {
          position: 'absolute',
          top: 54,
          right: 18,
          padding: 12,
          borderRadius: 20,
          backgroundColor: 'white'
        },
        children: (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontWeight: '800'
          },
          children: "Close scanner"
        })
      })]
    });
  }
  export default ResidentApp;
