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
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function () {
      return ResidentApp;
    }
  });
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
  var _reactNativeWebDistExportsText = require("react-native-web/dist/exports/Text");
  var Text = _interopDefault(_reactNativeWebDistExportsText);
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
        }), screen === 'updates' && (0, _reactJsxRuntime.jsx)(Updates, {}), screen === 'chat' && (0, _reactJsxRuntime.jsx)(Chat, {
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
  function Requests({
    go
  }) {
    const [rows, setRows] = (0, _react.useState)([]);
    const client = _libSupabase.supabase;
    const [tab, setTab] = (0, _react.useState)('All');
    const [busy, setBusy] = (0, _react.useState)(true);
    const [detail, setDetail] = (0, _react.useState)(null);
    const [reference, setReference] = (0, _react.useState)('');
    const [paymentError, setPaymentError] = (0, _react.useState)('');
    const [paying, setPaying] = (0, _react.useState)(false);
    const [scanning, setScanning] = (0, _react.useState)(false);
    async function submitPayment() {
      try {
        if (!_libSupabase.supabase || !detail) throw Error('Sign in and select a request.');
        if (!reference.trim()) throw Error('Enter the payment reference number.');
        setPaying(true);
        const {
          data: {
            user
          }
        } = await _libSupabase.supabase.auth.getUser();
        if (!user) throw Error('Unauthorized');
        const {
          data: resident
        } = await _libSupabase.supabase.from('residents').select('id').eq('user_id', user.id).single();
        if (!resident) throw Error('Resident profile not found');
        const {
          data: req,
          error: reqError
        } = await _libSupabase.supabase.from('document_requests').select('resident_id,fee_amount,payment_status').eq('id', detail.id).single();
        if (reqError || !req) throw Error('Request not found');
        if (req.resident_id !== resident.id) throw Error('Unauthorized access to this request');
        if (['Paid', 'Pending'].includes(req.payment_status)) throw Error(`Payment is already ${req.payment_status}`);
        if (!(req.fee_amount > 0)) throw Error('This request is free');
        const {
          error
        } = await _libSupabase.supabase.from('payments').insert({
          request_id: detail.id,
          resident_id: user.id,
          amount: req.fee_amount,
          provider: 'QR_PAY',
          reference_number: reference.trim(),
          status: 'Pending'
        });
        if (error) throw error;
        const {
          error: updateError
        } = await _libSupabase.supabase.from('document_requests').update({
          payment_status: 'Pending'
        }).eq('id', detail.id);
        if (updateError) throw Error('Payment recorded, but the request status could not be updated.');
        setReference('');
        setDetail(null);
        Alert.default.alert('Payment reference submitted', 'Barangay staff will verify your payment.');
      } catch (e) {
        setPaymentError(show(e));
      } finally {
        setPaying(false);
      }
    }
    const load = (0, _react.useCallback)(async () => {
      if (!client) {
        setBusy(false);
        return;
      }
      setBusy(true);
      try {
        const {
          data: {
            user
          }
        } = await client.auth.getUser();
        if (!user) throw Error('Sign in to view requests.');
        const {
          data: r
        } = await client.from('residents').select('id').eq('user_id', user.id).maybeSingle();
        if (!r) throw Error('Resident profile not found.');
        const {
          data,
          error
        } = await client.from('document_requests').select('id,status,fee_amount,payment_status,session_id,form_data,pickup_date,pickup_instructions,remarks,requested_date,document_type:document_types(name)').eq('resident_id', r.id).order('requested_date', {
          ascending: false
        });
        if (error) throw error;
        setRows(data || []);
      } catch (e) {
        setRows([]);
      } finally {
        setBusy(false);
      }
    }, []);
    (0, _react.useEffect)(() => {
      void load();
      if (!client) return;
      const ch = client.channel('resident-mobile-requests').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'document_requests'
      }, () => void load()).subscribe();
      return () => {
        void client.removeChannel(ch);
      };
    }, [load]);
    const filtered = rows.filter(r => tab === 'All' || (tab === 'Ready for Pickup' ? /ready|pickup/i.test(r.status) : r.status.toLowerCase().includes(tab.toLowerCase())));
    return (0, _reactJsxRuntime.jsxs)(_componentsUi.Page, {
      children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Title, {
        sub: "Track status, fees, and pickup schedules",
        children: "My Document Requests"
      }), (0, _reactJsxRuntime.jsxs)(_componentsUi.Row, {
        children: [(0, _reactJsxRuntime.jsxs)(View.default, {
          style: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4
          },
          children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Icon, {
            name: "fiber_manual_record",
            size: 12,
            color: _componentsUi.C.green
          }), (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 11,
              color: _componentsUi.C.green,
              fontWeight: '800'
            },
            children: "Live updates"
          })]
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
          title: "+ New request",
          onPress: () => go('new-request')
        })]
      }), (0, _reactJsxRuntime.jsx)(ScrollView.default, {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        contentContainerStyle: {
          gap: 7
        },
        children: ['All', 'Pending', 'Ready for Pickup', 'Approved', 'Released'].map(x => (0, _reactJsxRuntime.jsx)(_componentsUi.Chip, {
          title: x,
          active: tab === x,
          onPress: () => setTab(x)
        }, x))
      }), busy ? (0, _reactJsxRuntime.jsx)(Text.default, {
        style: {
          textAlign: 'center',
          padding: 24,
          color: _componentsUi.C.muted
        },
        children: "Loading your applications..."
      }) : filtered.length === 0 ? (0, _reactJsxRuntime.jsxs)(_componentsUi.Card, {
        children: [(0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            textAlign: 'center',
            fontWeight: '800',
            color: _componentsUi.C.text
          },
          children: "No requests found"
        }), (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            textAlign: 'center',
            fontSize: 12,
            color: _componentsUi.C.muted
          },
          children: "Ask the AI Assistant or apply for a Clearance or Certificate."
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
          title: "Open Chatbot Assistant",
          onPress: () => go('chat')
        })]
      }) : filtered.map(r => (0, _reactJsxRuntime.jsxs)(_componentsUi.Card, {
        children: [(0, _reactJsxRuntime.jsxs)(_componentsUi.Row, {
          children: [(0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontWeight: '800',
              flex: 1,
              color: _componentsUi.C.text
            },
            children: r.document_type?.name || 'Barangay Document'
          }), (0, _reactJsxRuntime.jsx)(_componentsUi.Chip, {
            title: r.status,
            active: /ready|approved/i.test(r.status),
            onPress: () => setDetail(r)
          })]
        }), (0, _reactJsxRuntime.jsxs)(Text.default, {
          style: {
            fontSize: 11,
            color: _componentsUi.C.muted
          },
          children: ["Submitted ", new Date(r.requested_date).toLocaleDateString(), " ", String.fromCharCode(183), " Payment ", r.payment_status || 'Not paid', " ", String.fromCharCode(183), " ", String.fromCharCode(8369), Number(r.fee_amount || 0).toFixed(2)]
        }), (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontSize: 12,
            color: _componentsUi.C.muted
          },
          children: r.remarks || r.pickup_instructions || ''
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
          title: "View details / payment",
          secondary: true,
          onPress: () => setDetail(r)
        })]
      }, r.id)), (0, _reactJsxRuntime.jsx)(Modal.default, {
        visible: !!detail,
        transparent: true,
        animationType: "slide",
        onRequestClose: () => setDetail(null),
        children: (0, _reactJsxRuntime.jsx)(View.default, {
          style: {
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: '#0006'
          },
          children: (0, _reactJsxRuntime.jsxs)(View.default, {
            style: {
              backgroundColor: 'white',
              padding: 20,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              gap: 12
            },
            children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Title, {
              children: detail?.document_type?.name || 'Request details'
            }), (0, _reactJsxRuntime.jsxs)(Text.default, {
              children: ["Status: ", detail?.status]
            }), (0, _reactJsxRuntime.jsxs)(Text.default, {
              children: ["Purpose: ", detail?.remarks || '-']
            }), (0, _reactJsxRuntime.jsxs)(Text.default, {
              children: ["Pickup date: ", detail?.pickup_date || 'Not scheduled']
            }), (0, _reactJsxRuntime.jsx)(Text.default, {
              children: detail?.pickup_instructions || ''
            }), (0, _reactJsxRuntime.jsxs)(Text.default, {
              children: ["Fee: ", String.fromCharCode(8369), Number(detail?.fee_amount || 0).toFixed(2), "  ", String.fromCharCode(183), "  ", detail?.payment_status || '-']
            }), Number(detail?.fee_amount || 0) > 0 && detail?.payment_status !== 'Paid' && detail?.payment_status !== 'Pending' && (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
              children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Input, {
                value: reference,
                onChangeText: setReference,
                placeholder: "Payment reference number",
                autoCapitalize: "characters"
              }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
                title: "Scan payment QR",
                secondary: true,
                onPress: () => setScanning(true)
              }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
                title: "Submit payment reference",
                onPress: () => void submitPayment(),
                loading: paying
              }), !!paymentError && (0, _reactJsxRuntime.jsx)(_componentsUi.ErrorBox, {
                children: paymentError
              })]
            }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
              title: "Close",
              onPress: () => setDetail(null)
            })]
          })
        })
      }), (0, _reactJsxRuntime.jsx)(Modal.default, {
        visible: scanning,
        animationType: "slide",
        onRequestClose: () => setScanning(false),
        children: (0, _reactJsxRuntime.jsx)(QRScanner, {
          onScan: data => {
            setReference(data);
            setScanning(false);
          },
          onClose: () => setScanning(false)
        })
      })]
    });
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
  function Updates() {
    const [ann, setAnn] = (0, _react.useState)([]);
    const client = _libSupabase.supabase;
    const [programs, setPrograms] = (0, _react.useState)([]);
    const [applied, setApplied] = (0, _react.useState)({});
    const [tab, setTab] = (0, _react.useState)('programs');
    const [filter, setFilter] = (0, _react.useState)('All');
    const [msg, setMsg] = (0, _react.useState)('');
    const [refresh, setRefresh] = (0, _react.useState)(false);
    const load = (0, _react.useCallback)(async () => {
      if (!client) return;
      setRefresh(true);
      try {
        const [a, p] = await Promise.all([client.from('announcements').select('id,title,description,category,created_at,event_start_at,venue').eq('status', 'Published').order('created_at', {
          ascending: false
        }), client.from('barangay_programs').select('id,name,description,category,status,image_url,purok,venue,schedule_details,requirements,registration_open,registration_deadline,registration_opens_at,event_start_at,event_end_at,max_participants,min_age,max_age').eq('is_public', true).in('status', ['Active', 'On Hold']).order('created_at', {
          ascending: false
        })]);
        setAnn(a.data || []);
        setPrograms(p.data || []);
        const {
          data: {
            user
          }
        } = await client.auth.getUser();
        if (user) {
          const {
            data: r
          } = await client.from('residents').select('id').eq('user_id', user.id).maybeSingle();
          if (r) {
            const {
              data: e
            } = await client.from('program_enrollees').select('program_id,status').eq('resident_id', r.id);
            setApplied(Object.fromEntries((e || []).map(x => [x.program_id, x.status])));
          }
        }
      } finally {
        setRefresh(false);
      }
    }, []);
    (0, _react.useEffect)(() => {
      void load();
      if (!client) return;
      const ch = client.channel('resident-mobile-updates').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'announcements'
      }, () => void load()).on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'barangay_programs'
      }, () => void load()).subscribe();
      return () => {
        void client.removeChannel(ch);
      };
    }, [load]);
    async function join(id) {
      try {
        const {
          error
        } = await client.rpc('apply_to_barangay_program', {
          p_program_id: id
        });
        if (error) throw error;
        setApplied(x => ({
          ...x,
          [id]: 'Pending'
        }));
        setMsg('Application submitted. Await barangay review.');
      } catch (e) {
        setMsg(show(e));
      }
    }
    return (0, _reactJsxRuntime.jsxs)(_componentsUi.Page, {
      children: [(0, _reactJsxRuntime.jsxs)(_componentsUi.Row, {
        children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Title, {
          sub: "Programs and official announcements from Barangay Hall",
          children: "Barangay Updates"
        }), (0, _reactJsxRuntime.jsx)(Pressable.default, {
          onPress: () => void load(),
          children: (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              color: _componentsUi.C.blue
            },
            children: "Refresh"
          })
        })]
      }), !!msg && (0, _reactJsxRuntime.jsx)(_componentsUi.ErrorBox, {
        children: msg
      }), (0, _reactJsxRuntime.jsxs)(_componentsUi.Row, {
        children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
          title: "Programs",
          secondary: tab !== 'programs',
          onPress: () => setTab('programs')
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
          title: "Announcements",
          secondary: tab !== 'announcements',
          onPress: () => setTab('announcements')
        })]
      }), tab === 'programs' ? (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
        children: [(0, _reactJsxRuntime.jsxs)(_componentsUi.Label, {
          children: ["Barangay Programs - ", programs.length, " available"]
        }), (0, _reactJsxRuntime.jsx)(ScrollView.default, {
          horizontal: true,
          showsHorizontalScrollIndicator: false,
          contentContainerStyle: {
            gap: 7
          },
          children: ['All', ...new Set(programs.map(p => p.category))].map(c => (0, _reactJsxRuntime.jsx)(_componentsUi.Chip, {
            title: c,
            active: filter === c,
            onPress: () => setFilter(c)
          }, c))
        }), programs.filter(p => filter === 'All' || p.category === filter).map(p => (0, _reactJsxRuntime.jsxs)(_componentsUi.Card, {
          children: [!!p.image_url && (0, _reactJsxRuntime.jsx)(Image.default, {
            source: {
              uri: p.image_url
            },
            style: {
              height: 150,
              borderRadius: 12
            }
          }), (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 10,
              fontWeight: '800',
              color: _componentsUi.C.blue
            },
            children: p.category
          }), (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 16,
              fontWeight: '800',
              color: _componentsUi.C.text
            },
            children: p.name
          }), p.status === 'On Hold' && (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              color: '#a16207'
            },
            children: "Historical / citywide reference. Verify with the barangay office."
          }), (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 12,
              color: _componentsUi.C.muted
            },
            children: p.description
          }), (0, _reactJsxRuntime.jsxs)(Text.default, {
            style: {
              fontSize: 11,
              color: _componentsUi.C.muted
            },
            children: ["Area: ", p.purok || 'All Puroks', p.venue ? `${String.fromCharCode(183)} ${p.venue}` : '']
          }), p.event_start_at && (0, _reactJsxRuntime.jsxs)(Text.default, {
            style: {
              fontSize: 11,
              color: _componentsUi.C.blue
            },
            children: ["Event: ", new Date(p.event_start_at).toLocaleString()]
          }), p.requirements && (0, _reactJsxRuntime.jsxs)(Text.default, {
            style: {
              fontSize: 11,
              color: _componentsUi.C.muted
            },
            children: ["Requirements: ", p.requirements]
          }), (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontWeight: '700',
              color: p.registration_open ? _componentsUi.C.green : '#b45309'
            },
            children: p.registration_open ? 'Registration Open' : 'Registration Closed'
          }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
            title: applied[p.id] ? `Application: ${applied[p.id]}` : 'Join Program',
            disabled: !!applied[p.id] || p.status !== 'Active' || !p.registration_open || !!(p.registration_deadline && new Date(p.registration_deadline) < new Date()),
            onPress: () => void join(p.id)
          })]
        }, p.id))]
      }) : ann.length === 0 ? (0, _reactJsxRuntime.jsx)(_componentsUi.Card, {
        children: (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            textAlign: 'center',
            color: _componentsUi.C.muted
          },
          children: "No announcements yet."
        })
      }) : ann.map(a => (0, _reactJsxRuntime.jsxs)(_componentsUi.Card, {
        children: [(0, _reactJsxRuntime.jsxs)(_componentsUi.Row, {
          children: [(0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 10,
              fontWeight: '800',
              color: _componentsUi.C.blue
            },
            children: a.category
          }), (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 10,
              color: _componentsUi.C.muted
            },
            children: new Date(a.created_at).toLocaleDateString()
          })]
        }), (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontSize: 15,
            fontWeight: '800',
            color: _componentsUi.C.text
          },
          children: a.title
        }), a.venue && (0, _reactJsxRuntime.jsxs)(Text.default, {
          style: {
            fontSize: 11,
            color: _componentsUi.C.muted
          },
          children: ["Venue: ", a.venue]
        }), (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontSize: 12,
            color: _componentsUi.C.muted
          },
          children: a.description
        })]
      }, a.id))]
    });
  }
  function Chat({
    user
  }) {
    const [messages, setMessages] = (0, _react.useState)([{
      role: 'assistant',
      content: "Hello! I'm Ate Sora, your Barangay Tandang Sora assistant. Ask me about barangay services, documents, policies, or programs."
    }]);
    const [text, setText] = (0, _react.useState)('');
    const [busy, setBusy] = (0, _react.useState)(false);
    const [lang, setLang] = (0, _react.useState)('tgl');
    const [sessionId] = (0, _react.useState)(() => 'mobile-' + Date.now());
    async function send() {
      const q = text.trim();
      if (!q || busy) return;
      const requestedForm = (0, _libChatDocumentForms.requestedChatDocument)(q);
      setText('');
      setMessages(m => [...m, {
        role: 'user',
        content: q
      }]);
      setBusy(true);
      let persistedSessionId = null;
      try {
        if (user && _libSupabase.supabase) {
          const {
            data: row,
            error: sessionError
          } = await _libSupabase.supabase.from('chat_sessions').upsert({
            user_id: user.id,
            session_token: sessionId,
            last_active_at: new Date().toISOString()
          }, {
            onConflict: 'session_token'
          }).select('id').single();
          if (sessionError) throw sessionError;
          persistedSessionId = row?.id || null;
          if (persistedSessionId) {
            const {
              error
            } = await _libSupabase.supabase.from('chat_messages').insert({
              user_id: user.id,
              sender: 'user',
              message: q,
              session_id: persistedSessionId
            });
            if (error) throw error;
          }
        }
        const base = _libSupabase.pwaApiUrl || _libSupabase.apiBaseUrl;
        if (!base) throw Error('Configure a reachable PWA or API URL.');
        const {
          data: {
            session
          }
        } = _libSupabase.supabase ? await _libSupabase.supabase.auth.getSession() : {
          data: {
            session: null
          }
        };
        const endpoint = _libSupabase.pwaApiUrl ? '/api/chat' : '/api/v1/chat';
        if (!_libSupabase.pwaApiUrl && !session?.access_token) throw Error('Guest chat requires the resident PWA API URL.');
        const payload = _libSupabase.pwaApiUrl ? {
          message: q,
          sessionId,
          language: lang
        } : {
          query: q,
          language: lang
        };
        const response = await fetch((base.endsWith('/') ? base.slice(0, -1) : base) + endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? {
              Authorization: 'Bearer ' + session.access_token
            } : {})
          },
          body: JSON.stringify(payload)
        });
        let body;
        try {
          body = await response.json();
        } catch {
          throw Error('The AI service returned an invalid response.');
        }
        if (!response.ok) throw Error(body.detail || body.error || 'AI service unavailable.');
        const answer = String(body.answer || body.response || body.message || '');
        if (!answer) throw Error('The assistant returned an empty response.');
        setMessages(m => [...m, {
          role: 'assistant',
          content: answer,
          citations: Array.isArray(body.citations) ? body.citations : [],
          formType: requestedForm || undefined,
          formSchema: body.formSchema && typeof body.formSchema === "object" ? body.formSchema : undefined
        }]);
        if (persistedSessionId && user && _libSupabase.supabase) {
          const {
            error
          } = await _libSupabase.supabase.from('chat_messages').insert({
            user_id: user.id,
            sender: 'ai',
            message: answer,
            form_type: requestedForm || null,
            citations: Array.isArray(body.citations) ? body.citations : [],
            model_used: 'gemini-1.5-flash',
            session_id: persistedSessionId
          });
          if (error) throw error;
          await _libSupabase.supabase.from('chat_sessions').update({
            last_active_at: new Date().toISOString()
          }).eq('session_token', sessionId).eq('user_id', user.id);
        }
      } catch (e) {
        setMessages(m => [...m, {
          role: 'assistant',
          content: "I couldn't reach the assistant right now. " + show(e),
          error: true
        }]);
      } finally {
        setBusy(false);
      }
    }
    return (0, _reactJsxRuntime.jsxs)(_componentsUi.Page, {
      children: [(0, _reactJsxRuntime.jsxs)(View.default, {
        style: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 12,
          backgroundColor: _componentsUi.C.white,
          borderRadius: 15,
          borderWidth: 1,
          borderColor: _componentsUi.C.border
        },
        children: [(0, _reactJsxRuntime.jsx)(Image.default, {
          source: require("@/assets/images/ate-sora.jpg"),
          style: {
            width: 42,
            height: 42,
            borderRadius: 21
          }
        }), (0, _reactJsxRuntime.jsxs)(View.default, {
          style: {
            flex: 1
          },
          children: [(0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 15,
              fontWeight: '800',
              color: _componentsUi.C.text
            },
            children: "Ate Sora"
          }), (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 11,
              color: _componentsUi.C.muted
            },
            children: "Barangay Tandang Sora AI Assistant"
          })]
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Icon, {
          name: "auto_awesome",
          size: 19,
          color: _componentsUi.C.blue
        })]
      }), (0, _reactJsxRuntime.jsxs)(_componentsUi.Row, {
        children: [(0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontSize: 11,
            fontWeight: '700',
            color: _componentsUi.C.muted
          },
          children: "Response language"
        }), ['tgl', 'ceb', 'en'].map(l => (0, _reactJsxRuntime.jsx)(_componentsUi.Chip, {
          title: {
            tgl: 'Filipino',
            ceb: 'Cebuano',
            en: 'English'
          }[l],
          active: lang === l,
          onPress: () => setLang(l)
        }, l))]
      }), (0, _reactJsxRuntime.jsx)(View.default, {
        style: {
          flex: 1,
          minHeight: 300
        },
        children: (0, _reactJsxRuntime.jsx)(ScrollView.default, {
          contentContainerStyle: {
            gap: 12,
            paddingBottom: 10
          },
          keyboardShouldPersistTaps: "handled",
          children: messages.map((m, i) => (0, _reactJsxRuntime.jsxs)(View.default, {
            style: {
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '92%'
            },
            children: [(0, _reactJsxRuntime.jsxs)(View.default, {
              style: {
                backgroundColor: m.role === 'user' ? _componentsUi.C.blue : _componentsUi.C.white,
                borderRadius: 16,
                borderWidth: m.role === 'user' ? 0 : 1,
                borderColor: m.error ? '#fecaca' : _componentsUi.C.border,
                padding: 12
              },
              children: [(0, _reactJsxRuntime.jsx)(Text.default, {
                style: {
                  fontSize: 13,
                  lineHeight: 19,
                  color: m.role === 'user' ? 'white' : m.error ? _componentsUi.C.red : _componentsUi.C.text
                },
                children: m.content
              }), !!m.citations?.length && (0, _reactJsxRuntime.jsxs)(Text.default, {
                style: {
                  fontSize: 10,
                  color: _componentsUi.C.muted,
                  marginTop: 6
                },
                children: ["Sources: ", m.citations.join(', ')]
              })]
            }), m.formType && (0, _reactJsxRuntime.jsx)(_componentsChatRequestForm.ChatRequestForm, {
              type: m.formType,
              sessionToken: sessionId,
              formSchema: m.formSchema
            })]
          }, i))
        })
      }), (0, _reactJsxRuntime.jsxs)(_componentsUi.Row, {
        children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Input, {
          value: text,
          onChangeText: setText,
          onSubmitEditing: () => void send(),
          placeholder: "Message Ate Sora...",
          returnKeyType: "send",
          multiline: true,
          style: {
            flex: 1,
            maxHeight: 100
          }
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
          title: busy ? '...' : 'Send',
          onPress: () => void send(),
          disabled: !text.trim() || busy
        })]
      })]
    });
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
  function Register({
    go
  }) {
    const [busy, setBusy] = (0, _react.useState)(false);
    const [err, setErr] = (0, _react.useState)('');
    async function openRegistration() {
      setErr('');
      if (!_libSupabase.pwaApiUrl) {
        setErr('Set EXPO_PUBLIC_PWA_API_URL to the existing resident portal to continue secure registration.');
        return;
      }
      setBusy(true);
      try {
        const base = _libSupabase.pwaApiUrl.endsWith('/') ? _libSupabase.pwaApiUrl.slice(0, -1) : _libSupabase.pwaApiUrl;
        await WebBrowser.openBrowserAsync(base + '/register', {
          toolbarColor: _componentsUi.C.blue,
          showTitle: true
        });
      } catch (e) {
        setErr(show(e));
      } finally {
        setBusy(false);
      }
    }
    return (0, _reactJsxRuntime.jsxs)(_componentsUi.Page, {
      children: [(0, _reactJsxRuntime.jsxs)(View.default, {
        style: {
          alignItems: 'center',
          paddingVertical: 20
        },
        children: [(0, _reactJsxRuntime.jsx)(Image.default, {
          source: require("@/assets/images/barangay-logo.png"),
          style: {
            width: 64,
            height: 64,
            resizeMode: 'contain'
          }
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Title, {
          sub: "Create a verified resident account",
          children: "Resident Registration"
        })]
      }), (0, _reactJsxRuntime.jsxs)(_componentsUi.Card, {
        children: [(0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontSize: 13,
            lineHeight: 20,
            color: _componentsUi.C.text
          },
          children: "Registration uses the barangay?s secure resident portal to validate your details and identity documents. Your account will use the same Smart Barangay authentication and Supabase records as the web app."
        }), (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontSize: 12,
            lineHeight: 18,
            color: _componentsUi.C.muted
          },
          children: "You will complete the PWA?s four registration steps, including personal information, barangay address, account details, and ID verification. After submission, barangay staff review your application."
        })]
      }), !!err && (0, _reactJsxRuntime.jsx)(_componentsUi.ErrorBox, {
        children: err
      }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
        title: busy ? 'Opening secure registration...' : 'Continue to secure registration',
        onPress: () => void openRegistration(),
        loading: busy
      }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
        title: "Already registered? Sign in",
        secondary: true,
        onPress: () => go('login')
      })]
    });
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
  function Profile({
    user,
    go,
    onSignedOut
  }) {
    const [name, setName] = (0, _react.useState)(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Resident');
    const [editing, setEditing] = (0, _react.useState)(false);
    const [notifications, setNotifications] = (0, _react.useState)([]);
    const [modal, setModal] = (0, _react.useState)('');
    const [household, setHousehold] = (0, _react.useState)({
      number: '',
      size: '1',
      income: '',
      housing: 'Owned',
      relationship: 'Household Head',
      senior: false,
      pwd: false,
      fourPs: false
    });
    const [modalError, setModalError] = (0, _react.useState)('');
    (0, _react.useEffect)(() => {
      if (user && _libSupabase.supabase) _libSupabase.supabase.from('notifications').select('id,title,message,read_status,created_at').eq('user_id', user.id).order('created_at', {
        ascending: false
      }).limit(10).then(({
        data
      }) => setNotifications(data || []));
    }, [user]);
    async function save() {
      await _libSupabase.supabase?.auth.updateUser({
        data: {
          full_name: name
        }
      });
      setEditing(false);
      Alert.default.alert('Profile', 'Profile information updated.');
    }
    async function saveHousehold() {
      try {
        setModalError('');
        if (!_libSupabase.supabase || !user) throw Error('Sign in to complete onboarding.');
        const {
          data: resident,
          error: rError
        } = await _libSupabase.supabase.from('residents').select('id,verification_status').eq('user_id', user.id).maybeSingle();
        if (rError || !resident) throw Error('Resident profile not found.');
        if (resident.verification_status !== 'Verified') throw Error('Your account must be verified before household onboarding.');
        const {
          data: existing,
          error: lookupError
        } = await _libSupabase.supabase.from('households').select('id').eq('household_head_id', resident.id).maybeSingle();
        if (lookupError) throw lookupError;
        const householdNo = household.number.trim() || `HH-${resident.id.slice(0, 8).toUpperCase()}`;
        let householdId = existing?.id;
        if (householdId) {
          const {
            error
          } = await _libSupabase.supabase.from('households').update({
            household_number: householdNo,
            member_count: Math.max(1, Number(household.size) || 1),
            monthly_income: Math.max(0, Number(household.income) || 0),
            housing_type: household.housing
          }).eq('id', householdId);
          if (error) throw error;
        } else {
          const {
            data,
            error
          } = await _libSupabase.supabase.from('households').insert({
            household_number: householdNo,
            household_head_id: resident.id,
            member_count: Math.max(1, Number(household.size) || 1),
            monthly_income: Math.max(0, Number(household.income) || 0),
            housing_type: household.housing
          }).select('id').single();
          if (error || !data) throw error || Error('Unable to save household');
          householdId = data.id;
        }
        const {
          data: member
        } = await _libSupabase.supabase.from('household_members').select('id').eq('household_id', householdId).eq('resident_id', resident.id).maybeSingle();
        const memberResult = member ? await _libSupabase.supabase.from('household_members').update({
          relationship: household.relationship.trim() || 'Household Head'
        }).eq('id', member.id) : await _libSupabase.supabase.from('household_members').insert({
          household_id: householdId,
          resident_id: resident.id,
          relationship: household.relationship.trim() || 'Household Head'
        });
        if (memberResult.error) throw memberResult.error;
        const {
          error: updateError
        } = await _libSupabase.supabase.from('residents').update({
          senior_status: household.senior,
          pwd_status: household.pwd,
          four_ps_status: household.fourPs,
          household_onboarding_completed: true,
          household_onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', resident.id);
        if (updateError) throw updateError;
        await _libSupabase.supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'COMPLETE_RESIDENT_ONBOARDING',
          module: 'residents',
          details: {
            resident_id: resident.id,
            household_id: householdId,
            household_size: Math.max(1, Number(household.size) || 1),
            senior_status: household.senior,
            pwd_status: household.pwd,
            four_ps_status: household.fourPs
          }
        });
        setModal('');
        Alert.default.alert('Resident profile', 'Household information saved.');
      } catch (e) {
        setModalError(show(e));
      }
    }
    return (0, _reactJsxRuntime.jsxs)(_componentsUi.Page, {
      children: [(0, _reactJsxRuntime.jsxs)(_componentsUi.Card, {
        style: {
          alignItems: 'center',
          paddingVertical: 22
        },
        children: [(0, _reactJsxRuntime.jsx)(View.default, {
          style: {
            height: 72,
            width: 72,
            borderRadius: 36,
            backgroundColor: _componentsUi.C.blue,
            alignItems: 'center',
            justifyContent: 'center'
          },
          children: (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 27,
              color: 'white',
              fontWeight: '800'
            },
            children: name.charAt(0).toUpperCase()
          })
        }), (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontSize: 18,
            fontWeight: '800',
            color: _componentsUi.C.text
          },
          children: name
        }), (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontSize: 12,
            color: _componentsUi.C.muted
          },
          children: user?.email || 'Guest session'
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
          title: "Edit Profile",
          secondary: true,
          onPress: () => setEditing(v => !v)
        }), editing && (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
          children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Input, {
            value: name,
            onChangeText: setName
          }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
            title: "Save Changes",
            onPress: () => void save()
          })]
        })]
      }), (0, _reactJsxRuntime.jsxs)(_componentsUi.Card, {
        children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Label, {
          children: "Household Information"
        }), (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontSize: 12,
            color: _componentsUi.C.muted
          },
          children: "Add household details and program eligibility for a verified resident record."
        }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
          title: "Complete resident profile",
          secondary: true,
          onPress: () => {
            setModalError('');
            setModal('Household onboarding');
          }
        })]
      }), (0, _reactJsxRuntime.jsx)(_componentsUi.Card, {
        children: ['Notifications', 'Privacy & Security', 'Help & Support'].map(x => (0, _reactJsxRuntime.jsx)(Pressable.default, {
          onPress: () => setModal(x),
          style: {
            paddingVertical: 11,
            borderBottomWidth: .5,
            borderColor: _componentsUi.C.border
          },
          children: (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              color: _componentsUi.C.text,
              fontWeight: '600'
            },
            children: x
          })
        }, x))
      }), (0, _reactJsxRuntime.jsxs)(_componentsUi.Card, {
        children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Label, {
          children: "Latest Notifications"
        }), notifications.length ? notifications.map(n => (0, _reactJsxRuntime.jsxs)(Pressable.default, {
          onPress: async () => {
            await _libSupabase.supabase?.from('notifications').update({
              read_status: true
            }).eq('id', n.id);
            setNotifications(a => a.map(x => x.id === n.id ? {
              ...x,
              read_status: true
            } : x));
          },
          children: [(0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontWeight: n.read_status ? '500' : '800',
              color: _componentsUi.C.text
            },
            children: n.title
          }), (0, _reactJsxRuntime.jsx)(Text.default, {
            style: {
              fontSize: 11,
              color: _componentsUi.C.muted
            },
            children: n.message
          })]
        }, n.id)) : (0, _reactJsxRuntime.jsx)(Text.default, {
          style: {
            fontSize: 12,
            color: _componentsUi.C.muted
          },
          children: "No new notifications"
        })]
      }), user ? (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
        title: "Sign Out",
        onPress: async () => {
          await _libSupabase.supabase?.auth.signOut();
          onSignedOut();
          go('login');
        }
      }) : (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
        title: "Sign In",
        onPress: () => go('login')
      }), (0, _reactJsxRuntime.jsx)(Modal.default, {
        transparent: true,
        visible: !!modal,
        animationType: "fade",
        onRequestClose: () => setModal(''),
        children: (0, _reactJsxRuntime.jsx)(View.default, {
          style: {
            flex: 1,
            justifyContent: 'center',
            padding: 24,
            backgroundColor: '#0006'
          },
          children: (0, _reactJsxRuntime.jsxs)(_componentsUi.Card, {
            children: [(0, _reactJsxRuntime.jsx)(_componentsUi.Title, {
              children: modal
            }), modal === 'Household onboarding' ? (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
              children: [(0, _reactJsxRuntime.jsx)(Text.default, {
                style: {
                  fontSize: 12,
                  color: _componentsUi.C.muted
                },
                children: "Your account must be approved. These details help maintain household records and determine program eligibility."
              }), (0, _reactJsxRuntime.jsx)(_componentsUi.Input, {
                placeholder: "Household No. (optional)",
                value: household.number,
                onChangeText: v => setHousehold(h => ({
                  ...h,
                  number: v
                }))
              }), (0, _reactJsxRuntime.jsx)(_componentsUi.Input, {
                placeholder: "Household size",
                keyboardType: "number-pad",
                value: household.size,
                onChangeText: v => setHousehold(h => ({
                  ...h,
                  size: v
                }))
              }), (0, _reactJsxRuntime.jsx)(_componentsUi.Input, {
                placeholder: "Monthly income",
                keyboardType: "decimal-pad",
                value: household.income,
                onChangeText: v => setHousehold(h => ({
                  ...h,
                  income: v
                }))
              }), (0, _reactJsxRuntime.jsx)(_componentsUi.Input, {
                placeholder: "Housing: Owned / Rented / Informal Settler / Other",
                value: household.housing,
                onChangeText: v => setHousehold(h => ({
                  ...h,
                  housing: v
                }))
              }), (0, _reactJsxRuntime.jsx)(_componentsUi.Input, {
                placeholder: "Relationship to household head",
                value: household.relationship,
                onChangeText: v => setHousehold(h => ({
                  ...h,
                  relationship: v
                }))
              }), ['senior', 'pwd', 'fourPs'].map(k => (0, _reactJsxRuntime.jsx)(Pressable.default, {
                onPress: () => setHousehold(h => ({
                  ...h,
                  [k]: !h[k]
                })),
                children: (0, _reactJsxRuntime.jsxs)(Text.default, {
                  style: {
                    paddingVertical: 5,
                    color: _componentsUi.C.text
                  },
                  children: [household[k] ? '[x]' : '[ ]', " ", k === 'senior' ? 'Senior citizen' : k === 'pwd' ? 'Person with disability (PWD)' : '4Ps beneficiary']
                })
              }, k)), !!modalError && (0, _reactJsxRuntime.jsx)(_componentsUi.ErrorBox, {
                children: modalError
              }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
                title: "Save profile",
                onPress: () => void saveHousehold()
              })]
            }) : (0, _reactJsxRuntime.jsx)(Text.default, {
              style: {
                fontSize: 13,
                color: _componentsUi.C.muted
              },
              children: modal === 'Notifications' ? 'Push notifications for barangay announcements and document updates are available when configured for this app.' : modal === 'Privacy & Security' ? 'Your personal details are protected by the existing Supabase authorization policies.' : 'Need help? Contact the Barangay Hall or chat with the AI Assistant.'
            }), (0, _reactJsxRuntime.jsx)(_componentsUi.Button, {
              title: "Close",
              secondary: true,
              onPress: () => setModal('')
            })]
          })
        })
      })]
    });
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