import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ControllerViewProps } from './ControllerTypes';
import Slider from '@react-native-community/slider';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

function formatTime(second: number) {
  let i = 0,
    s = second;
  if (s > 60) {
    i = Math.floor(s / 60);
    s = s % 60;
  }

  // 补零
  const zero = function (v: number) {
    return v >> 0 < 10 ? '0' + v : v;
  };
  return [zero(i), zero(s)].join(':');
}
const ControllerView = ({
  total,
  current,
  isFull,
  isLandscape,
  isStart,
  onPressedStart,
  isLoading,
  onFull,
  onSliderValueChange,
  onBack,
  title,
  speed = 1,
  setSpeed,
  timing,
  setTiming,
  videoList,
  showTiming = false,
  selectBitrateIndex = 0,
  setSelectBitrateIndex,
  isHiddenBack = false,
  isHiddenController = false,
  isHiddenFullBack = false,
}: ControllerViewProps) => {
  const isMountRef = useRef(true);
  const [hide, setHide] = useState(false);
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [showSliderTips, setShowSliderTips] = useState(false);
  const [choiceView, setChoiceView] = useState(0); // 0不显示 1定时 2倍数 3清晰度
  const [sliderValue, setSliderValue] = useState(current);
  const [autoHide, setAutoHide] = useState(true); /// 自动隐藏
  // const [timing, setTiming] = useState(-1); // 定时时间: -1 不开启

  const onValueChange = (value: number) => {
    setSliderValue(Math.round(value));
    // onSliderValueChange?.(value);
  };
  useEffect(() => {
    isMountRef.current = true;
    return () => {
      isMountRef.current = false;
    };
  }, []);
  const timeOutRef = useRef<any>();
  useEffect(() => {
    if (!hide && autoHide) {
      if (timeOutRef.current) {
        clearTimeout(timeOutRef.current);
        timeOutRef.current = null;
      }
      timeOutRef.current = setTimeout(() => {
        if (!isMountRef.current) {
          return;
        }
        setHide(true);
      }, 4000);
    }
  }, [hide, autoHide]);
  useEffect(() => {
    if (!isLoading) {
      setHide(false);
    }
  }, [isLoading]);
  useEffect(() => {
    setSliderValue(current);
  }, [current, setSliderValue]);

  const onSlidingStart = () => {
    setAutoHide(false);
    setHide(false);
    setShowSliderTips(true);
  };
  const onSlidingComplete = (value: number) => {
    setAutoHide(true);
    setSliderValue(Math.round(value));
    onSliderValueChange?.(value);
    /// 结束拖动之后慢慢小时
    setTimeout(() => {
      if (!isMountRef.current) {
        return;
      }
      setShowSliderTips(false);
    }, 500);
  };
  // 计算是否在有效区域点击
  const calculateEffectiveArea = (y: number) => {
    if (height - y < 95) {
      return true;
    }
    return false;
  };

  const singleTap = Gesture.Tap()
    .runOnJS(true)
    .maxDuration(250)
    .onStart((res) => {
      if (hide || calculateEffectiveArea(res.y)) {
        setHide(false); // 显示
        return;
      }
      if (choiceView !== 0) {
        setHide(false);
        setChoiceView(0);
        return;
      }
      setHide(true); // 隐藏
    });
  const doubleTap = Gesture.Tap()
    .runOnJS(true)
    .maxDuration(250)
    .numberOfTaps(2)
    .onStart(() => {
      setHide(false);
      onPressedStart?.();
    });
  const panGes = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => {
      setHide(false);
      setAutoHide(false);
      setShowSliderTips(true);
    })
    .onUpdate((e) => {
      if (Math.abs(e.translationX) < 15) return;
      setHide(false);
      if (width === 0) return;
      let progress = e.translationX / width;
      if (progress > 1) {
        progress = 1;
      }
      if (progress < -1) {
        progress = -1;
      }
      const value = Math.round(total * progress);
      let targetValue = current + value;
      if (targetValue < 0) {
        targetValue = 0;
      }
      if (targetValue > total) {
        targetValue = total;
      }
      setSliderValue(targetValue);
    })
    .onEnd((e) => {
      setAutoHide(true);
      if (Math.abs(e.translationX) < 15) return;
      setTimeout(() => {
        if (!isMountRef.current) {
          return;
        }
        setShowSliderTips(false);
      }, 500);
      onSliderValueChange?.(sliderValue);
    });
  const onLayout = (e: LayoutChangeEvent) => {
    setHeight(e.nativeEvent.layout.height);
    setWidth(e.nativeEvent.layout.width);
  };

  // 设置定时
  const onTiming = (time: number) => {
    setTiming(time);
    setChoiceView(0);
  };

  const renderContainer = () => {
    const showBack = !isFull && !isHiddenBack;
    if (isLoading) {
      return (
        <>
          {showBack && (
            <View style={styles.top}>
              <TouchableOpacity onPress={onBack}>
                <Image
                  style={styles.topLeftIcon}
                  source={require('./assets/chevron-down.png')}
                />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.loading}>
            <ActivityIndicator color={'#FFFFFF'} animating />
            <Text style={styles.loadingText}>正在加载中...</Text>
          </View>
        </>
      );
    }
    if (hide) {
      return (
        <>
          {showBack && (
            <View style={styles.top}>
              <TouchableOpacity onPress={onBack}>
                <Image
                  style={styles.topLeftIcon}
                  source={require('./assets/chevron-down.png')}
                />
              </TouchableOpacity>
            </View>
          )}
        </>
      );
    }
    const imageBg = require('./assets/by_gradual.png');
    const imageBg2 = require('./assets/by_gradual_2.png');

    return (
      <>
        {showSliderTips && (
          <View style={styles.sliderTips}>
            <Text style={styles.time}>{`${formatTime(sliderValue)}/${formatTime(
              total
            )}`}</Text>
          </View>
        )}
        {isFull && !isHiddenFullBack ? (
          <ImageBackground
            source={imageBg2}
            resizeMode="cover"
            style={[styles.top, { left: isFull && isLandscape ? 30 : 0 }]}
          >
            <TouchableOpacity onPress={onFull} style={styles.topView}>
              <Image
                style={styles.topLeftIcon}
                source={require('./assets/chevron-left.png')}
              />
              <Text style={styles.title}>{title ?? ''}</Text>
            </TouchableOpacity>
          </ImageBackground>
        ) : (
          !isHiddenBack && (
            <ImageBackground
              source={imageBg2}
              resizeMode="cover"
              style={styles.top}
            >
              <TouchableOpacity onPress={onBack}>
                <Image
                  style={styles.topLeftIcon}
                  source={require('./assets/chevron-down.png')}
                />
              </TouchableOpacity>
            </ImageBackground>
          )
        )}

        {choiceView == 1 && (
          <View style={styles.choiceView}>
            <TouchableOpacity
              style={[styles.choiceItem, styles.choiceItemSelected]}
              onPress={() => {
                onTiming(60 * 60);
              }}
            >
              <Text style={styles.choiceText}>60分钟</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceItem, styles.choiceItemSelected]}
              onPress={() => {
                onTiming(30 * 60);
              }}
            >
              <Text style={styles.choiceText}>30分钟</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceItem, styles.choiceItemSelected]}
              onPress={() => {
                onTiming(15 * 60);
              }}
            >
              <Text style={styles.choiceText}>15分钟</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceItem, styles.choiceItemSelected]}
              onPress={() => {
                onTiming(total - current);
              }}
            >
              <Text style={styles.choiceText}>播完本集</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceItem]}
              onPress={() => {
                onTiming(-1);
              }}
            >
              <Text style={styles.choiceText}>不开启</Text>
            </TouchableOpacity>
          </View>
        )}
        {choiceView == 2 && (
          <View style={styles.choiceView}>
            <TouchableOpacity
              style={[styles.choiceItem, styles.choiceItemSelected]}
              onPress={() => {
                setSpeed?.(2.5), setChoiceView(0);
              }}
            >
              <Text style={styles.choiceText}>2.5x</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceItem, styles.choiceItemSelected]}
              onPress={() => {
                setSpeed?.(2), setChoiceView(0);
              }}
            >
              <Text style={styles.choiceText}>2.0x</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceItem, styles.choiceItemSelected]}
              onPress={() => {
                setSpeed?.(1.5), setChoiceView(0);
              }}
            >
              <Text style={styles.choiceText}>1.5x</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceItem, styles.choiceItemSelected]}
              onPress={() => {
                setSpeed?.(1.25), setChoiceView(0);
              }}
            >
              <Text style={styles.choiceText}>1.25x</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceItem]}
              onPress={() => {
                setSpeed?.(1), setChoiceView(0);
              }}
            >
              <Text style={styles.choiceText}>正常</Text>
            </TouchableOpacity>
          </View>
        )}
        {choiceView == 3 && (
          <View style={styles.choiceView}>
            {videoList?.map((product, index) => (
              <TouchableOpacity
                style={[
                  styles.choiceItem,
                  videoList.length > index + 1 && styles.choiceItemSelected,
                ]}
                key={product.index + index}
                onPress={() => {
                  setSelectBitrateIndex?.(product.index), setChoiceView(0);
                }}
              >
                <Text style={styles.choiceText}>{product.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!isHiddenController && (
          <ImageBackground
            source={imageBg}
            resizeMode="cover"
            style={[styles.bottom, { left: isFull && isLandscape ? 30 : 0 }]}
          >
            <Slider
              minimumTrackTintColor={'#FF4040'}
              maximumTrackTintColor={'rgba(255,255,255,0.8)'}
              style={styles.slider}
              // thumbTintColor={'#FF4040'}
              thumbImage={require('./assets/play_thumb.png')}
              onSlidingStart={onSlidingStart}
              onSlidingComplete={onSlidingComplete}
              minimumValue={0}
              onValueChange={onValueChange}
              value={current}
              maximumValue={total}
            />
            <View style={styles.bottomView}>
              <TouchableOpacity onPress={onPressedStart}>
                <Image
                  style={styles.bottomLeftIcon}
                  source={
                    isStart
                      ? require('./assets/pause.png')
                      : require('./assets/play.png')
                  }
                />
              </TouchableOpacity>
              <View style={styles.timeView}>
                <Text style={styles.time}>{formatTime(current)} / </Text>
                <Text style={styles.time}>{formatTime(total)}</Text>
              </View>
              {showTiming && isFull && (
                <TouchableOpacity
                  onPress={() => setChoiceView(1)}
                  style={styles.bottomButtom}
                >
                  <Text style={styles.buttomText}>
                    {timing == -1 ? '定时' : formatTime(timing)}
                  </Text>
                </TouchableOpacity>
              )}
              {isFull && (
                <TouchableOpacity
                  onPress={() => setChoiceView(2)}
                  style={styles.bottomButtom}
                >
                  <Text style={styles.buttomText}>
                    {speed == 1 ? '倍速' : speed + 'x'}
                  </Text>
                </TouchableOpacity>
              )}
              {videoList && videoList.length > 0 && isFull && (
                <TouchableOpacity
                  onPress={() => setChoiceView(3)}
                  style={styles.bottomButtom}
                >
                  <Text style={styles.buttomText}>
                    {videoList?.map(
                      (product) =>
                        product.index == selectBitrateIndex && product.title
                    )}
                  </Text>
                </TouchableOpacity>
              )}
              {
                <TouchableOpacity onPress={onFull} style={styles.bottomFull}>
                  <Image
                    style={styles.bottomRightIcon}
                    source={
                      isFull
                        ? require('./assets/exit-fullscreen.png')
                        : require('./assets/fullscreen.png')
                    }
                  />
                  <Text style={styles.time}>{isFull && '退出全屏'}</Text>
                </TouchableOpacity>
              }
            </View>
          </ImageBackground>
        )}
      </>
    );
  };
  return (
    <GestureHandlerRootView style={styles.root} onLayout={onLayout}>
      <GestureDetector
        gesture={Gesture.Exclusive(doubleTap, singleTap, panGes)}
      >
        <View collapsable={false} style={styles.container}>
          {renderContainer()}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  root: {
    flex: 1,
  },
  time: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  top: {
    position: 'absolute',
    left: 10,
    top: 0,
    right: 10,
    paddingTop: 10,
  },
  topView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topLeftIcon: {
    width: 36,
    height: 36,
  },
  bottom: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: 10,
  },
  bottomView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 20,
  },
  timeView: {
    flex: 1,
    flexDirection: 'row',
  },
  bottomButtom: {
    alignItems: 'center',
    // marginLeft: 10,
    marginRight: 10,
    borderColor: '#ffffff',
    borderWidth: 0.5,
    borderRadius: 20,
    paddingLeft: 15,
    paddingRight: 15,
    height: 25,
    justifyContent: 'center',
  },
  buttomText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  bottomFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    flex: 1,
    justifyContent: 'center',
  },
  slider: {
    flex: 1,
    width: '100%',
  },
  sliderTips: {
    width: 90,
    height: 28,
    borderRadius: 4,
    backgroundColor: 'rgba(100,100,100,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  bottomLeftIcon: {
    width: 30,
    height: 30,
    marginRight: 8,
  },
  bottomRightIcon: {
    width: 24,
    height: 24,
    marginLeft: 8,
    marginRight: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 10,
  },
  choiceView: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    height: '100%',
    width: 200,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: 10,
    zIndex: 10,
  },
  choiceItem: {
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    height: '16%',
    width: 160,
  },
  choiceItemSelected: {
    borderBottomColor: '#cccccc60',
    borderBottomWidth: 0.3,
  },
  choiceText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
});
export default ControllerView;
