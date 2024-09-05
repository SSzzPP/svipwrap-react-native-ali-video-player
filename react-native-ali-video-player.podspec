require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-ali-video-player"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "8.0" }
  s.source       = { :git => "https://github.com/SSzzPP/svipwrap-react-native-ali-video-player.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}"
  s.static_framework = true

  s.dependency "React-Core"
  s.dependency 'AliPlayerSDK_iOS', '5.5.2.0'
end
