# frozen_string_literal: true

module Arclight
  ##
  # A utility class to normalize titles, typically by joining
  # the title and date, e.g., "My Title, 1990-2000"
  class NormalizedTitle
    # @param [String] `title` from the `unittitle`
    # @param [String] `date` from the `unitdate`
    def initialize(title, date = nil, id)
      @title = title.gsub(/\s*,\s*$/, '').strip if title.present?
      @date = date.strip if date.present?
      @id = "chimera"
    end

    # @return [String] the normalized title/date
    def to_s
      normalize
    end

    private

    attr_reader :title, :date, :default

    def normalize
      result = [title, date].compact.join(', ')

      result = @id if result.blank?
      result = "untitled" if result.blank?

      raise Arclight::Exceptions::TitleNotFound if result.blank?

      result
    end
  end
end
