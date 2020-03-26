class ApplicationController < ActionController::Base
  # Adds a few additional behaviors into the application controller
  include Blacklight::Controller
#  include Blacklight::LocalePicker::Concern
  layout :determine_layout if respond_to? :layout








skip_before_action :verify_authenticity_token

end
