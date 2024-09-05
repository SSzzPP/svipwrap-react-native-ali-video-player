import {
  NativeSyntheticEvent,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { AliVideoView } from './AliVideoView';
import type { VideoPlayerHandler, VideoPlayerProps } from './PlayTypes';
import type { AliVideoViewHandleType, BitrateType } from './VideoTypes';
import { useBackHandler, useDimensions } from '@react-native-community/hooks';
import ControllerView from './ControllerView';

const VideoPlayer = forwardRef(
  (
    {
      source,
      onCompletion,
      onBufferProgress,
      onPrepare,
      onProgress,
      onFullScreen,
      onError,
      style,
      title,
      onBack,
      isLandscape,
      onAliBufferedPositionUpdate,
      onAliBitrateReady,
      onAliCurrentPositionUpdate,
      onAliLoadingBegin,
      onAliCompletion,
      onAliLoadingEnd,
      onAliError,
      onAliPrepared,
      onAliRenderingStart,
      onGetTiming,
      onGetSpeed,
      isHiddenControllerView,
      isHiddenController,
      isHiddenBack,
      showTiming,
      setSpeed,
      selectBitrateIndex,
      isHiddenFullBack,
      ...rest
    }: VideoPlayerProps,
    ref: React.Ref<VideoPlayerHandler>
  ) => {
    const videoRef = useRef<AliVideoViewHandleType>(null);
    const [isFull, setIsFull] = useState(false);
    const [isStopPlay, setIsStopPlay] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(true);
    const [buffer, setBuffer] = useState(0);
    const [complete, setComplete] = useState(false); // 是否加载完成
    const [playSource, setPlaySource] = useState(source);
    const [innerHiddenBack, setInnerHiddenBack] = useState(isHiddenBack);
    const [innerHiddenFullBack, setInnerHiddenFullBack] =
      useState(isHiddenFullBack);
    const [innerSetSpeed, setInnerSetSpeed] = useState(setSpeed);
    const [innerSelectBitrateIndex, setInnerSelectBitrateIndex] =
      useState(selectBitrateIndex);
    const { screen, window } = useDimensions();
    const [videoList, setVideoList] = useState<BitrateType[]>([]);
    const [audioList, setAudioList] = useState<BitrateType | undefined>();
    const [timing, setTiming] = useState(-1); // 定时时间: -1 不开启

    const timingOutRef = useRef<any>();
    useEffect(() => {
      if (timing <= -1) {
        clearTimeout(timingOutRef.current);
        timingOutRef.current = null;
        setTiming(-1);
        return;
      }
      timingOutRef.current = setTimeout(() => {
        onGetTiming?.(timing - 1);
        setTiming(timing - 1);
      }, 1000);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timing]);

    useEffect(() => {
      setInnerHiddenBack(isHiddenBack);
    }, [isHiddenBack]);
    useEffect(() => {
      setInnerHiddenFullBack(isHiddenFullBack);
    }, [isHiddenFullBack]);
    useEffect(() => {
      setInnerSetSpeed(innerSetSpeed);
    }, [innerSetSpeed]);
    useEffect(() => {
      setInnerSelectBitrateIndex(innerSelectBitrateIndex);
    }, [innerSelectBitrateIndex]);
    useImperativeHandle(ref, () => ({
      play: () => {
        handlePlay();
      },
      pause: () => {
        handlePause();
      },
      stop: () => {
        handleStop();
      },
      full: (f: boolean) => {
        if (f) {
          handleFullScreenIn();
        } else {
          handleFullScreenOut();
        }
      },
      seekTo: (position: number) => {
        videoRef.current?.seekTo(position);
      },

      onSpeed: (s: number) => {
        setInnerSetSpeed(s);
      },

      onBitrateIndex: (index: number) => {
        setInnerSelectBitrateIndex(index);
      },

      onSetTiming: (s: number) => {
        onTiming(s);
      },

      destroy: () => {
        videoRef.current?.destroyPlay();
      },
    }));
    useBackHandler(() => {
      if (isFull) {
        handleFullScreenOut();
        return true;
      }
      return false;
    });
    const handlePlay = () => {
      if (complete) {
        videoRef.current?.restartPlay();
        setComplete(false);
      } else if (isStopPlay) {
        videoRef.current?.reloadPlay();
      } else {
        videoRef.current?.startPlay();
      }
      setIsPlaying(true);
    };
    const handlePause = () => {
      videoRef.current?.pausePlay();
      setIsPlaying(false);
    };
    const handleStop = () => {
      videoRef.current?.stopPlay();
      setIsStopPlay(true);
      setIsPlaying(false);
    };
    const handleFullScreenIn = () => {
      onFullScreen?.(true);
      setIsFull(true);
    };
    const handleFullScreenOut = () => {
      onFullScreen?.(false);
      setIsFull(false);
    };
    useEffect(() => {
      setPlaySource(source);
    }, [source]);
    const _onAliPrepared = (e: NativeSyntheticEvent<{ duration: number }>) => {
      setDuration(e.nativeEvent.duration);
      setCurrentTime(0);
      setBuffer(0);
      onPrepare?.(e.nativeEvent.duration);
      onAliPrepared?.(e);
    };
    const _onAliLoadingBegin = (e: NativeSyntheticEvent<{}>) => {
      setLoading(true);
      onAliLoadingBegin?.(e);
    };
    const _onAliLoadingEnd = (e: NativeSyntheticEvent<{}>) => {
      setLoading(false);
      onAliLoadingEnd?.(e);
    };
    const _onAliRenderingStart = (e: NativeSyntheticEvent<{}>) => {
      setLoading(false);
      setIsPlaying(true);
      onAliRenderingStart?.(e);
    };
    const _onAliCurrentPositionUpdate = (
      e: NativeSyntheticEvent<{ position: number }>
    ) => {
      setCurrentTime(e.nativeEvent.position);
      onProgress?.(e.nativeEvent.position);
      onAliCurrentPositionUpdate?.(e);
    };
    const _onAliBufferedPositionUpdate = (
      e: NativeSyntheticEvent<{ position: number }>
    ) => {
      setBuffer(e.nativeEvent.position);
      onBufferProgress?.(e.nativeEvent.position);
      onAliBufferedPositionUpdate?.(e);
    };
    const _onAliBitrateReady = (
      e: NativeSyntheticEvent<{ bitrates: [BitrateType] }>
    ) => {
      if (e.nativeEvent.bitrates && e.nativeEvent.bitrates.length > 0) {
        setInnerSelectBitrateIndex(e.nativeEvent.bitrates[0].index);
      }
      const bitrates = e.nativeEvent.bitrates;
      let videoList: BitrateType[] = [];
      let audioList: BitrateType | undefined;
      for (let index = 0; index < bitrates.length; index++) {
        const element = bitrates[index];
        switch (element.height) {
          case 360:
            element.title = '流畅';
            videoList.push(element);
            break;
          case 540:
            element.title = '标清';
            videoList.push(element);
            break;
          case 720:
            element.title = '高清';
            videoList.push(element);
            break;
          case 0:
            element.title = '音频';
            audioList = element;
            break;
          default:
            break;
        }
      }
      setVideoList(videoList);
      setAudioList(audioList);
      onAliBitrateReady?.(e);
    };
    const _onAliCompletion = (e: NativeSyntheticEvent<{}>) => {
      setIsPlaying(false);
      setComplete(true);
      onCompletion?.();
      onAliCompletion?.(e);
    };
    const _onAliError = (
      e: NativeSyntheticEvent<{ code: string; message: string }>
    ) => {
      onError?.(e.nativeEvent.code, e.nativeEvent.message);
      onAliError?.(e);
    };
    const onSliderValueChange = (value: number) => {
      if (complete) {
        videoRef.current?.seekTo(value);
        videoRef.current?.startPlay();
        setIsPlaying(true);
      } else {
        videoRef.current?.seekTo(value);
        setIsPlaying(true);
      }
    };
    const onPressedStart = () => {
      if (isPlaying) {
        handlePause();
      } else {
        handlePlay();
      }
    };
    const onSetSpeed = (value: number) => {
      setInnerSetSpeed(value);
      onGetSpeed?.(value);
    };
    const onSelectBitrateIndex = (value: number) => {
      setInnerSelectBitrateIndex(value);
    };
    const onFull = () => {
      if (isFull) {
        handleFullScreenOut();
      } else {
        handleFullScreenIn();
      }
    };

    // 设置定时
    const onTiming = (time: number) => {
      clearTimeout(timingOutRef.current);
      timingOutRef.current = null;
      setTiming(time - 1);
    };
    // const isOrientationLandscape = isLandscape;
    // const currentHeight = StatusBar.currentHeight
    //   ? StatusBar.currentHeight / 2
    //   : 0;
    const fullscreenStyle = StyleSheet.flatten<ViewStyle>([
      {
        position: 'absolute',
        top: 0,
        right: 0,
        width: isLandscape
          ? Math.max(screen.width, screen.height)
          : Math.min(screen.width, screen.height),
        height: isLandscape
          ? Math.min(screen.width, screen.height)
          : Math.max(screen.width, screen.height),
        zIndex: 999,
      },
    ]);
    const fullWindowStyle = StyleSheet.flatten<ViewStyle>([
      {
        position: 'absolute',
        top: 0,
        left: 0,
        width: isLandscape
          ? Math.max(window.width, window.height)
          : Math.min(window.width, window.height),
        height: isLandscape
          ? Math.min(window.width, window.height)
          : Math.max(window.width, window.height),
      },
    ]);

    return (
      <View style={[styles.base, isFull ? fullscreenStyle : style]}>
        <AliVideoView
          style={isFull ? fullWindowStyle : StyleSheet.absoluteFill}
          source={playSource}
          onAliBufferedPositionUpdate={_onAliBufferedPositionUpdate}
          onAliBitrateReady={_onAliBitrateReady}
          onAliLoadingBegin={_onAliLoadingBegin}
          onAliLoadingEnd={_onAliLoadingEnd}
          onAliPrepared={_onAliPrepared}
          onAliRenderingStart={_onAliRenderingStart}
          onAliCurrentPositionUpdate={_onAliCurrentPositionUpdate}
          onAliCompletion={_onAliCompletion}
          onAliError={_onAliError}
          setSpeed={innerSetSpeed}
          selectBitrateIndex={innerSelectBitrateIndex}
          {...rest}
          ref={videoRef}
        />
        {!isHiddenControllerView && (
          <ControllerView
            title={title}
            onPause={handlePause}
            onPressedStart={onPressedStart}
            onSliderValueChange={onSliderValueChange}
            current={currentTime}
            isFull={isFull}
            isLandscape={isLandscape}
            isHiddenController={isHiddenController}
            onFull={onFull}
            isHiddenBack={innerHiddenBack}
            isHiddenFullBack={innerHiddenFullBack}
            speed={innerSetSpeed}
            setSpeed={onSetSpeed}
            selectBitrateIndex={innerSelectBitrateIndex}
            setSelectBitrateIndex={onSelectBitrateIndex}
            videoList={videoList}
            audioList={audioList}
            buffer={buffer}
            isError={false}
            showTiming={showTiming}
            isLoading={loading}
            isStart={isPlaying}
            total={duration}
            onBack={onBack}
            timing={timing}
            setTiming={onTiming}
          />
        )}
      </View>
    );
  }
);
const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
});

export default VideoPlayer;
